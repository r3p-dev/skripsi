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
import type { TransactionClientContract } from '@adonisjs/lucid/types/database'
import { errors as vineErrors } from '@vinejs/vine'
import { DateTime } from 'luxon'
import RouteService, { type RouteItem } from '#services/route_service'
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
 * Manages staff pickup, delivery, and inspection tasks: route
 * planning, per-task locking, and task completion.
 */
@inject()
export default class TaskService {
  constructor(private routeService: RouteService) {}

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
  async getTripQueue(originLat: number, originLng: number): Promise<RouteItem[]> {
    const today = DateTime.now().startOf('day')

    const orders = await Order.query()
      .where((pickups) => {
        pickups
          .where('status', OrderStatus.PICKUP_SCHEDULED)
          .where('pickup_date', '<=', today.toISODate()!)
      })
      .orWhere('status', OrderStatus.IN_DELIVERY)
      .preload('address')
      .preload('actions')

    const available = orders.filter((order) => {
      const type =
        order.status === OrderStatus.IN_DELIVERY ? ActionName.DELIVERY : ActionName.PICKUP

      return this.resolveTaskLock(order, type) === null
    })

    return this.routeService.buildRoutePlanForOrders(this.toRouteOrders(available), {
      originLat,
      originLng,
    })
  }

  /**
   * Returns the orders waiting to be inspected that no one is working on,
   * oldest first so shoes are not left sitting on the shelf.
   */
  async getInspectionQueue(): Promise<Order[]> {
    const orders = await Order.query()
      .whereIn('status', TASK_STATUSES[ActionName.INSPECTION])
      .orderBy('created_at', 'asc')
      .preload('actions')

    return orders.filter((order) => this.resolveTaskLock(order, ActionName.INSPECTION) === null)
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
      .preload('items', (itemsQuery) => {
        itemsQuery.preload('service').preload('item')
      })
      .preload('actions')
  }

  /**
   * Finds the task a staff member is currently holding, if any.
   *
   * A staff member may only work one task at a time, so the queue redirects
   * them back to this task until they finish or cancel it.
   */
  async findActiveTask(staff: User): Promise<{ orderNumber: string; type: TaskType } | null> {
    const claimable = [ActionName.PICKUP, ActionName.DELIVERY, ActionName.INSPECTION] as const

    const orders = await Order.query()
      .whereIn(
        'status',
        claimable.flatMap((type) => TASK_STATUSES[type])
      )
      .whereHas('actions', (actionsQuery) => {
        actionsQuery.where('staff_id', staff.id).whereIn(
          'name',
          claimable.map((type) => ATTEMPT_ACTION[type])
        )
      })
      .preload('actions')

    for (const order of orders) {
      for (const type of claimable) {
        if (this.resolveTaskLock(order, type)?.staffId === staff.id) {
          return { orderNumber: order.orderNumber, type }
        }
      }
    }

    return null
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
   * Determines which staff, if any, currently holds the lock
   * for a task by inspecting its most recent attempt/release action.
   */
  resolveTaskLock(order: Order, type: TaskType): { staffId: number } | null {
    const relevantNames: string[] = [ATTEMPT_ACTION[type], RELEASE_ACTION[type], type]

    const lastAction = order.actions
      .filter((action) => relevantNames.includes(action.name))
      .sort((a, b) => a.createdAt.toMillis() - b.createdAt.toMillis())
      .at(-1)

    if (lastAction?.name === ATTEMPT_ACTION[type]) {
      return { staffId: lastAction.staffId }
    }

    return null
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
   */
  async claimTask(
    staff: User,
    orderNumber: string,
    type: TaskType
  ): Promise<{ order: Order; lock: { staffId: number } }> {
    const order = await this.getTaskOrder(orderNumber, type)
    const lock = this.resolveTaskLock(order, type)

    if (lock) {
      return { order, lock }
    }

    await db.transaction(async (trx) => {
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

      /**
       * Claiming a pickup is visible to the customer as "Dalam Penjemputan",
       * so they know someone is on the way. The other task types have no
       * equivalent in-progress status to show.
       */
      if (type === ActionName.PICKUP) {
        await order.merge({ status: OrderStatus.IN_PICKUP }).useTransaction(trx).save()
      }
    })

    return { order, lock: { staffId: staff.id } }
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

    return db.transaction(async (trx) => {
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

      return order.merge({ status: NEXT_STATUS[type] }).useTransaction(trx).save()
    })
  }

  /**
   * Completes an inspection with the inspected item and service data,
   * storing a proof photo and moving the order to await payment.
   */
  async completeInspection(staff: User, orderNumber: string, data: InspectionData): Promise<Order> {
    const order = await this.getTaskOrderHeldBy(staff, orderNumber, ActionName.INSPECTION)
    const photoPath = await this.storePhoto(ActionName.INSPECTION, data.photo)

    return db.transaction(async (trx) => {
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
        .merge({ totalPrice, status: OrderStatus.AWAITING_PAYMENT })
        .useTransaction(trx)
        .save()
    })
  }

  /**
   * Releases a task lock previously claimed by the staff member, putting the
   * order back in the queue for someone else to pick up.
   */
  async releaseTask(staff: User, orderNumber: string, type: TaskType): Promise<Order> {
    const order = await this.getTaskOrderHeldBy(staff, orderNumber, type)

    return db.transaction(async (trx) => {
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
      if (type === ActionName.PICKUP) {
        return order.merge({ status: OrderStatus.PICKUP_SCHEDULED }).useTransaction(trx).save()
      }

      return order
    })
  }

  /**
   * Marks an order as finished cleaning, recording the "after" photo that
   * pairs with the inspection photo taken before the shoes were washed.
   *
   * Walk-in orders have no pickup address — the customer collects them at the
   * counter — so there is nothing to deliver and they are done. Everything
   * else joins the delivery half of the trip queue.
   */
  async markCleaningDone(staff: User, orderNumber: string, data: CleaningData): Promise<Order> {
    const order = await Order.query()
      .where('order_number', orderNumber)
      .where('status', OrderStatus.IN_CLEANING)
      .firstOrFail()

    const photoPath = await this.storePhoto('cleaning', data.photo)

    return db.transaction(async (trx) => {
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

      const nextStatus = order.addressId ? OrderStatus.IN_DELIVERY : OrderStatus.COMPLETED

      return order.merge({ status: nextStatus }).useTransaction(trx).save()
    })
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

    return db.transaction(async (trx) => {
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
   * storage/delivery, storage/inspection, storage/cleaning — so a whole
   * category can be browsed, audited, or archived without picking through
   * unrelated images.
   */
  private async storePhoto(
    folder: TaskType | 'cleaning',
    photo: CompleteTaskData['photo']
  ): Promise<string> {
    const key = `${folder}/${randomUUID()}.${photo.extname}`
    await drive.use().putStream(key, createReadStream(photo.tmpPath!))

    return drive.use().getSignedUrl(key, { expiresIn: PHOTO_RETENTION })
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
