import { ActionName } from '#enums/order_action_enum'
import { OrderStatus } from '#enums/order_status_enum'
import Order from '#models/order'
import OrderAction from '#models/order_action'
import Item from '#models/item'
import OrderItem from '#models/order_item'
import Service from '#models/service'
import type User from '#models/user'
import type {
  CleaningData,
  CompleteTaskData,
  InspectionData,
  OrderItemsData,
} from '#validators/order_validator'
import type { ItemData } from '#validators/shared'
import { inject } from '@adonisjs/core'
import db from '@adonisjs/lucid/services/db'
import type { ModelQueryBuilderContract } from '@adonisjs/lucid/types/model'
import type { TransactionClientContract } from '@adonisjs/lucid/types/database'
import { errors as vineErrors } from '@vinejs/vine'
import { DateTime } from 'luxon'
import RouteService, { type RouteItem } from '#services/route_service'
import BroadcastService from '#services/broadcast_service'
import { shop } from '#config/shop'
import drive from '@adonisjs/drive/services/main'
import { createReadStream } from 'node:fs'
import { randomUUID } from 'node:crypto'

/**
 * Staff task types, each tied to the order status that
 * makes an order eligible for that task.
 */
export type TaskType =
  typeof ActionName.PICKUP | typeof ActionName.DELIVERY | typeof ActionName.INSPECTION

/**
 * Statuses an order may be in while it is still eligible for a task.
 *
 * Pickup accepts two: claiming a pickup flips the order to IN_PICKUP so the
 * customer can see a staff member is on the way, and the task must remain
 * reachable afterwards.
 */
const TASK_STATUSES: Record<TaskType, OrderStatus[]> = {
  [ActionName.PICKUP]: [OrderStatus.PICKUP_SCHEDULED, OrderStatus.IN_PICKUP],
  [ActionName.DELIVERY]: [OrderStatus.IN_DELIVERY],
  [ActionName.INSPECTION]: [OrderStatus.IN_INSPECTION],
}

const ATTEMPT_ACTION: Record<TaskType, ActionName> = {
  [ActionName.PICKUP]: ActionName.ATTEMPT_PICKUP,
  [ActionName.DELIVERY]: ActionName.ATTEMPT_DELIVERY,
  [ActionName.INSPECTION]: ActionName.ATTEMPT_INSPECTION,
}

const RELEASE_ACTION: Record<TaskType, ActionName> = {
  [ActionName.PICKUP]: ActionName.RELEASE_PICKUP,
  [ActionName.DELIVERY]: ActionName.RELEASE_DELIVERY,
  [ActionName.INSPECTION]: ActionName.RELEASE_INSPECTION,
}

/**
 * Task types that are completed with a proof photo and move
 * the order straight to its next stage. Inspection is completed
 * differently (with item and service data), not a plain photo.
 */
export type PhotoTaskType = typeof ActionName.PICKUP | typeof ActionName.DELIVERY

const NEXT_STATUS: Record<PhotoTaskType, OrderStatus> = {
  [ActionName.PICKUP]: OrderStatus.IN_INSPECTION,
  [ActionName.DELIVERY]: OrderStatus.COMPLETED,
}

/**
 * How long a proof photo's signed URL stays valid.
 *
 * Matched to how long the files themselves are kept: proofs are retained for
 * three months for cleaning purposes and then deleted, so a longer-lived URL
 * would only ever point at something that no longer exists.
 */
const PHOTO_RETENTION = '90d'

/**
 * How long a claim survives before it lapses on its own.
 *
 * Sized for the city rather than for the task: crossing Bandung can take an
 * hour in traffic and a run of stops is several of those. Three hours leaves a
 * staff member who is genuinely still driving well clear of losing the stop
 * out from under them, while making sure a claim somebody abandoned — flat
 * battery, end of shift, simply forgot — is back in the queue the same day
 * rather than needing an admin to go and edit a row.
 */
const CLAIM_DURATION_HOURS = 3

/**
 * Postgres answers an UPDATE with the number of rows it touched, and Lucid
 * passes that through untouched. Zero means the row no longer matched the
 * condition — somebody else's claim landed first.
 */
function affectedRows(result: unknown): number {
  return Number(Array.isArray(result) ? result[0] : result) || 0
}

/**
 * Manages staff pickup, delivery, and inspection tasks: route
 * planning, per-task locking, and task completion.
 */
@inject()
export default class TaskService {
  constructor(
    private routeService: RouteService,
    private broadcastService: BroadcastService
  ) {}

  /**
   * Narrows a query to the orders nobody is currently holding.
   *
   * The lock is three columns on the order, so "free" is a question the
   * database can answer. It used to be derived in JavaScript by replaying an
   * order's whole action log, which meant every queue had to `preload` those
   * actions and then filter the rows it had just fetched — work no index could
   * help with, growing with every action ever recorded.
   */
  private whereUnlocked<T extends ModelQueryBuilderContract<typeof Order>>(query: T): T {
    const now = DateTime.now().toSQL()!

    query.where((free) => {
      free.whereNull('locked_until').orWhere('locked_until', '<=', now)
    })

    return query
  }

  /**
   * Returns the pickup and delivery stops that are free to be worked on,
   * as one list ordered nearest-first from the shop.
   *
   * Only PICKUP_SCHEDULED and IN_DELIVERY are candidates: IN_PICKUP means a
   * staff member has already claimed that stop and is on their way to it, so
   * it is somebody's current task rather than available work.
   *
   * Overdue stops are mixed in with today's rather than listed separately:
   * a stop that was missed yesterday is simply another stop on the route.
   */
  async getTripQueue(): Promise<RouteItem[]> {
    const today = DateTime.now().startOf('day')

    const orders = await this.whereUnlocked(
      Order.query()
        .where((claimable) => {
          claimable
            .where((pickups) => {
              pickups
                .where('status', OrderStatus.PICKUP_SCHEDULED)
                .where('pickup_date', '<=', today.toISODate()!)
            })
            .orWhere('status', OrderStatus.IN_DELIVERY)
        })
        .preload('address')
    )

    return this.routeService.buildRoutePlanForOrders(this.toRouteOrders(orders), {
      originLat: shop.latitude,
      originLng: shop.longitude,
    })
  }

  /**
   * Returns the orders waiting to be inspected that no one is working on,
   * oldest first so shoes are not left sitting on the shelf.
   */
  async getInspectionQueue(): Promise<Order[]> {
    return this.whereUnlocked(
      Order.query()
        .whereIn('status', TASK_STATUSES[ActionName.INSPECTION])
        .orderBy('created_at', 'asc')
    )
  }

  /**
   * Returns the orders currently being cleaned, oldest first.
   *
   * Cleaning is not a claimable task — several staff work the same batch of
   * shoes — so unlike the other queues nothing is filtered out here.
   *
   * Actions come along so each card can show the inspection photo as the
   * "before" shot the washer compares their work against.
   */
  async getCleaningQueue(): Promise<Order[]> {
    return Order.query()
      .where('status', OrderStatus.IN_CLEANING)
      .orderBy('created_at', 'asc')
      .preload('items')
      .preload('actions')
  }

  /**
   * Returns the washed orders sitting on the shelf waiting for their owner to
   * come and collect them.
   *
   * Only orders with nowhere to deliver to ever reach this status, so this is
   * the counter's own list: done, paid for, and still here.
   */
  async getCollectionQueue(): Promise<Order[]> {
    return Order.query()
      .where('status', OrderStatus.CLEANING_DONE)
      .orderBy('updated_at', 'asc')
      .preload('items')
      .preload('actions')
  }

  /**
   * Finds the task a staff member is currently holding, if any.
   *
   * A staff member may only work one task at a time, so the queue redirects
   * them back to this task until they finish it, cancel it, or the claim lapses.
   */
  async findActiveTask(staff: User): Promise<{ orderNumber: string; type: TaskType } | null> {
    const order = await Order.query()
      .where('locked_by_id', staff.id)
      .where('locked_until', '>', DateTime.now().toSQL()!)
      .first()

    if (!order?.lockedTask) {
      return null
    }

    return { orderNumber: order.orderNumber, type: order.lockedTask as TaskType }
  }

  /**
   * Retrieves an order for a given task type, only matching
   * orders currently in a status that task type expects.
   */
  async getTaskOrder(orderNumber: string, type: TaskType): Promise<Order> {
    return Order.query()
      .where('order_number', orderNumber)
      .whereIn('status', TASK_STATUSES[type])
      .preload('address')
      .preload('items', (itemsQuery) => {
        itemsQuery.preload('service').preload('item')
      })
      .preload('actions', (actionsQuery) => {
        actionsQuery.preload('staff')
      })
      .firstOrFail()
  }

  /**
   * Which staff member, if any, currently holds this order's task.
   *
   * A claim that has run past its expiry is not a lock — it is the trace of
   * somebody who never came back, and the order is available again.
   */
  resolveTaskLock(order: Order, type: TaskType): { staffId: number } | null {
    if (order.lockedTask !== type || !order.lockedById || !order.lockedUntil) {
      return null
    }

    if (order.lockedUntil <= DateTime.now()) {
      return null
    }

    return { staffId: order.lockedById }
  }

  /**
   * Retrieves a task order and asserts the staff member is the one
   * currently holding its lock.
   *
   * Guards every action that mutates a task, so a staff member can never
   * complete or release work another staff member claimed.
   */
  private async getTaskOrderHeldBy(
    staff: User,
    orderNumber: string,
    type: TaskType
  ): Promise<Order> {
    const order = await this.getTaskOrder(orderNumber, type)
    const lock = this.resolveTaskLock(order, type)

    if (!lock || lock.staffId !== staff.id) {
      throw new vineErrors.E_VALIDATION_ERROR([
        {
          field: 'status',
          message: 'Anda tidak sedang memproses tugas ini.',
        },
      ])
    }

    return order
  }

  /**
   * Claims a task for a staff member so no other staff can process
   * the same pickup, delivery, or inspection at the same time.
   *
   * Opening the task is the claim itself: if it is already locked
   * by someone else, the existing lock is returned untouched instead
   * of failing, so the caller can render a "locked" view.
   *
   * The claim is taken with a conditional UPDATE rather than a read followed
   * by a write, so two staff tapping the same card in the same second cannot
   * both come away believing they hold it.
   */
  async claimTask(
    staff: User,
    orderNumber: string,
    type: TaskType
  ): Promise<{ order: Order; lock: { staffId: number } }> {
    const order = await this.getTaskOrder(orderNumber, type)
    const existing = this.resolveTaskLock(order, type)

    if (existing) {
      return { order, lock: existing }
    }

    const now = DateTime.now()

    const claimed = await db.transaction(async (trx) => {
      const won = affectedRows(
        await this.whereUnlocked(Order.query({ client: trx }).where('id', order.id)).update({
          locked_by_id: staff.id,
          locked_task: type,
          locked_until: now.plus({ hours: CLAIM_DURATION_HOURS }).toSQL(),
          /**
           * Claiming a pickup is visible to the customer as "Dalam
           * Penjemputan", so they know someone is on the way. The other task
           * types have no equivalent in-progress status to show.
           */
          ...(type === ActionName.PICKUP ? { status: OrderStatus.IN_PICKUP } : {}),
        })
      )

      if (won === 0) {
        return false
      }

      await OrderAction.create(
        {
          orderId: order.id,
          staffId: staff.id,
          name: ATTEMPT_ACTION[type],
          photoPath: null,
          note: null,
        },
        { client: trx }
      )

      return true
    })

    const fresh = await this.getTaskOrder(orderNumber, type)

    if (!claimed) {
      // Somebody landed their claim between our read and our update.
      return { order: fresh, lock: this.resolveTaskLock(fresh, type) ?? { staffId: staff.id } }
    }

    if (type === ActionName.PICKUP) {
      this.broadcastService.orderChanged(fresh)
      this.broadcastService.orderUpdated(fresh)
    }

    return { order: fresh, lock: { staffId: staff.id } }
  }

  /**
   * Completes a pickup or delivery task with a proof photo,
   * storing it via the configured drive disk and advancing the
   * order to its next stage.
   */
  async completeTask(
    staff: User,
    orderNumber: string,
    type: PhotoTaskType,
    data: CompleteTaskData
  ): Promise<Order> {
    const order = await this.getTaskOrderHeldBy(staff, orderNumber, type)
    const photoPath = await this.storePhoto(type, data.photo)

    const completed = await db.transaction(async (trx) => {
      await OrderAction.create(
        {
          orderId: order.id,
          staffId: staff.id,
          name: type,
          photoPath,
          note: null,
        },
        { client: trx }
      )

      return order
        .merge({ status: NEXT_STATUS[type], ...this.clearedLock() })
        .useTransaction(trx)
        .save()
    })

    this.broadcastService.orderChanged(completed)
    this.broadcastService.orderUpdated(completed)

    return completed
  }

  /**
   * Completes an inspection with the inspected item and service data,
   * storing a proof photo and moving the order to await payment.
   */
  async completeInspection(staff: User, orderNumber: string, data: InspectionData): Promise<Order> {
    const order = await this.getTaskOrderHeldBy(staff, orderNumber, ActionName.INSPECTION)
    const photoPath = await this.storePhoto(ActionName.INSPECTION, data.photo)

    const inspected = await db.transaction(async (trx) => {
      const totalPrice = await this.createOrderItems(order, data.items, trx)

      await OrderAction.create(
        {
          orderId: order.id,
          staffId: staff.id,
          name: ActionName.INSPECTION,
          photoPath,
          note: null,
        },
        { client: trx }
      )

      return order
        .merge({ totalPrice, status: OrderStatus.AWAITING_PAYMENT, ...this.clearedLock() })
        .useTransaction(trx)
        .save()
    })

    this.broadcastService.orderChanged(inspected)
    this.broadcastService.orderUpdated(inspected)

    return inspected
  }

  /**
   * Releases a task lock previously claimed by the staff member, putting the
   * order back in the queue for someone else to pick up.
   */
  async releaseTask(staff: User, orderNumber: string, type: TaskType): Promise<Order> {
    const order = await this.getTaskOrderHeldBy(staff, orderNumber, type)

    const released = await db.transaction(async (trx) => {
      await OrderAction.create(
        {
          orderId: order.id,
          staffId: staff.id,
          name: RELEASE_ACTION[type],
          photoPath: null,
          note: null,
        },
        { client: trx }
      )

      // Undo the in-progress status the claim put the order into.
      return order
        .merge({
          ...this.clearedLock(),
          ...(type === ActionName.PICKUP ? { status: OrderStatus.PICKUP_SCHEDULED } : {}),
        })
        .useTransaction(trx)
        .save()
    })

    if (type === ActionName.PICKUP) {
      this.broadcastService.orderChanged(released)
      this.broadcastService.orderUpdated(released)
    }

    return released
  }

  /**
   * Marks an order as finished cleaning, recording the "after" photo that
   * pairs with the inspection photo taken before the shoes were washed.
   *
   * Where it goes next turns on whether there is anywhere to take it. An order
   * with an address joins the delivery half of the trip queue. One without —
   * a walk-in whose owner is coming back for it — moves to `CLEANING_DONE`,
   * which is the shelf: washed, paid for, waiting to be collected. It is not
   * finished until somebody actually walks out with it.
   */
  async markCleaningDone(staff: User, orderNumber: string, data: CleaningData): Promise<Order> {
    const order = await Order.query()
      .where('order_number', orderNumber)
      .where('status', OrderStatus.IN_CLEANING)
      .firstOrFail()

    const photoPath = await this.storePhoto('cleaning', data.photo)

    const washed = await db.transaction(async (trx) => {
      await OrderAction.create(
        {
          orderId: order.id,
          staffId: staff.id,
          name: ActionName.CLEANING_DONE,
          photoPath,
          note: null,
        },
        { client: trx }
      )

      const nextStatus = order.addressId ? OrderStatus.IN_DELIVERY : OrderStatus.CLEANING_DONE

      return order.merge({ status: nextStatus }).useTransaction(trx).save()
    })

    this.broadcastService.orderChanged(washed)
    this.broadcastService.orderUpdated(washed)

    return washed
  }

  /**
   * Closes a walk-in order once its owner has taken it home from the counter.
   *
   * The one step in the lifecycle with no photo attached: the proof that the
   * shoes changed hands is the customer standing there, and photographing
   * every counter hand-over would be theatre.
   */
  async markCollected(staff: User, orderNumber: string): Promise<Order> {
    const order = await Order.query()
      .where('order_number', orderNumber)
      .where('status', OrderStatus.CLEANING_DONE)
      .firstOrFail()

    const collected = await db.transaction(async (trx) => {
      await OrderAction.create(
        {
          orderId: order.id,
          staffId: staff.id,
          name: ActionName.COLLECTED,
          photoPath: null,
          note: null,
        },
        { client: trx }
      )

      return order.merge({ status: OrderStatus.COMPLETED }).useTransaction(trx).save()
    })

    this.broadcastService.orderChanged(collected)
    this.broadcastService.orderUpdated(collected)

    return collected
  }

  /**
   * Retrieves an order whose items may still be corrected, with everything the
   * edit form needs: the current lines and the inspection photo staff took.
   *
   * Only an order that has been inspected but not yet paid matches. Once the
   * customer pays, the price they agreed to is fixed and the order is already
   * moving through cleaning, so there is nothing to correct any more.
   */
  async getEditableItemsOrder(orderNumber: string): Promise<Order> {
    return Order.query()
      .where('order_number', orderNumber)
      .where('status', OrderStatus.AWAITING_PAYMENT)
      .preload('items', (itemsQuery) => {
        itemsQuery.preload('service').preload('item')
      })
      .preload('actions', (actionsQuery) => {
        actionsQuery.preload('staff')
      })
      .firstOrFail()
  }

  /**
   * Replaces the items on an order that is still awaiting payment and reprices
   * it, for when staff mistyped a brand or picked the wrong service.
   *
   * The whole list is rewritten rather than diffed: the form always submits
   * every row, and an order at this stage has only a handful of lines.
   */
  async replaceOrderItems(staff: User, orderNumber: string, data: OrderItemsData): Promise<Order> {
    const order = await this.getEditableItemsOrder(orderNumber)

    const repriced = await db.transaction(async (trx) => {
      /**
       * Items belong to exactly one order's lines — they are created during
       * inspection or at the counter — so clearing the lines clears the items.
       */
      const replacedItemIds = order.items.map((orderItem) => orderItem.itemId)

      await OrderItem.query({ client: trx }).where('order_id', order.id).delete()

      if (replacedItemIds.length > 0) {
        await Item.query({ client: trx }).whereIn('id', replacedItemIds).delete()
      }

      const totalPrice = await this.createOrderItems(order, data.items, trx)

      await OrderAction.create(
        {
          orderId: order.id,
          staffId: staff.id,
          name: ActionName.ITEMS_EDITED,
          photoPath: null,
          note: null,
        },
        { client: trx }
      )

      return order.merge({ totalPrice }).useTransaction(trx).save()
    })

    this.broadcastService.orderUpdated(repriced)

    return repriced
  }

  /**
   * What a payload of items will cost, without writing anything.
   *
   * Lets the counter check that the cash offered actually covers the bill
   * before a photo is stored or a row is inserted, so a rejected payment
   * leaves nothing behind on disk or in the database. Prices come from the
   * same catalogue read `createOrderItems` uses a moment later.
   */
  async priceItems(items: ItemData[]): Promise<number> {
    const requestedServiceIds = new Set(
      items.flatMap((itemData) => [itemData.service, ...(itemData.additionalServices ?? [])])
    )

    const services = await Service.query().whereIn('id', [...requestedServiceIds])
    const pricesById = new Map(services.map((service) => [service.id, Number(service.price)]))

    return items.reduce((total, itemData) => {
      const serviceIds = [itemData.service, ...(itemData.additionalServices ?? [])]

      return total + serviceIds.reduce((sum, id) => sum + (pricesById.get(id) ?? 0), 0)
    }, 0)
  }

  /**
   * Creates items and their order items from inspected/offline item
   * data, returning the combined price of all items and services.
   */
  async createOrderItems(
    order: Order,
    items: ItemData[],
    trx: TransactionClientContract
  ): Promise<number> {
    /**
     * Every service the payload mentions, main and additional, fetched in one
     * query and kept by id. Pricing used to run a query per line, which made an
     * order of five pairs of shoes ten round trips.
     */
    const requestedServiceIds = new Set(
      items.flatMap((itemData) => [itemData.service, ...(itemData.additionalServices ?? [])])
    )

    const services = await Service.query({ client: trx }).whereIn('id', [...requestedServiceIds])
    const servicesById = new Map(services.map((service) => [service.id, service]))

    let totalPrice = 0

    for (const itemData of items) {
      const item = await Item.create(
        {
          type: itemData.type,
          brand: itemData.brand,
          model: itemData.model,
          material: itemData.material,
          size: String(itemData.size),
          condition: itemData.condition,
          note: itemData.note ?? null,
        },
        { client: trx }
      )

      const serviceIds = [itemData.service, ...(itemData.additionalServices ?? [])]

      for (const serviceId of serviceIds) {
        // A service id the payload made up is still a 404, the way findOrFail
        // has always answered it — one throwaway query on a bad payload only.
        const service = servicesById.get(serviceId) ?? (await Service.findOrFail(serviceId))
        const price = Number(service.price)

        await OrderItem.create(
          {
            orderId: order.id,
            itemId: item.id,
            serviceId: service.id,
            name: `${service.name} - ${item.brand} ${item.model}`,
            price,
            subtotal: price,
          },
          { client: trx }
        )

        totalPrice += price
      }
    }

    return totalPrice
  }

  /**
   * Stores an uploaded proof photo and returns a signed URL for it, since the
   * drive disk is configured as private.
   *
   * Photos are grouped by the kind of proof they are — storage/pickup,
   * storage/delivery, storage/inspection, storage/cleaning, storage/offline —
   * so a whole category can be browsed, audited, or archived without picking
   * through unrelated images.
   */
  async storePhoto(
    folder: TaskType | 'cleaning' | 'offline',
    photo: CompleteTaskData['photo']
  ): Promise<string> {
    const key = `${folder}/${randomUUID()}.${photo.extname}`
    await drive.use().putStream(key, createReadStream(photo.tmpPath!))

    return drive.use().getSignedUrl(key, { expiresIn: PHOTO_RETENTION })
  }

  /**
   * The three lock columns, blanked. Finishing or releasing a task always
   * frees the order, and spelling that out at every call site is how one of
   * them ends up missing a column and leaving an order locked to nobody.
   */
  private clearedLock() {
    return { lockedById: null, lockedTask: null, lockedUntil: null }
  }

  /**
   * Maps orders into the minimal structure required by the route service.
   */
  private toRouteOrders(orders: Order[]) {
    return orders.map((order) => ({
      id: order.id,
      orderNumber: order.orderNumber,
      status: order.status as OrderStatus,
      pickupDate: order.pickupDate,
      address: order.address
        ? {
            name: order.address.name,
            phone: order.address.phone,
            street: order.address.street,
            latitude: Number(order.address.latitude),
            longitude: Number(order.address.longitude),
            note: order.address.note ?? undefined,
          }
        : null,
    }))
  }
}
