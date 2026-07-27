import { ActionName } from '#enums/order_action_enum'
import { OrderStatus } from '#enums/order_status_enum'
import Order from '#models/order'
import OrderAction from '#models/order_action'
import Item from '#models/item'
import OrderItem from '#models/order_item'
import Service from '#models/service'
import type User from '#models/user'
import type { CompleteTaskData, InspectionData } from '#validators/order_validator'
import type { ItemData } from '#validators/shared'
import { inject } from '@adonisjs/core'
import db from '@adonisjs/lucid/services/db'
import type { TransactionClientContract } from '@adonisjs/lucid/types/database'
import { errors as vineErrors } from '@vinejs/vine'
import { DateTime } from 'luxon'
import RouteService from '#services/route_service'
import drive from '@adonisjs/drive/services/main'
import { createReadStream } from 'node:fs'
import { randomUUID } from 'node:crypto'

/**
 * Staff task types, each tied to the order status that
 * makes an order eligible for that task.
 */
export type TaskType =
  typeof ActionName.PICKUP | typeof ActionName.DELIVERY | typeof ActionName.INSPECTION

const TASK_STATUS: Record<TaskType, OrderStatus> = {
  [ActionName.PICKUP]: OrderStatus.PICKUP_SCHEDULED,
  [ActionName.DELIVERY]: OrderStatus.IN_DELIVERY,
  [ActionName.INSPECTION]: OrderStatus.IN_INSPECTION,
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
 * Manages staff pickup, delivery, and inspection tasks: route
 * planning, per-task locking, and task completion.
 */
@inject()
export default class TaskService {
  constructor(private service: RouteService) {}

  /**
   * Builds pickup and delivery routes grouped into today's
   * schedule and overdue orders.
   */
  async getUnifiedRoutePlanForDate(originLat: number, originLng: number) {
    const today = DateTime.now().startOf('day')

    const orders = await Order.query()
      .where('pickup_date', '<=', today.toISODate()!)
      .whereIn('status', [OrderStatus.PICKUP_SCHEDULED, OrderStatus.IN_DELIVERY])
      .preload('address')

    const [todayOrders, missedOrders] = this.splitOrdersByDate(orders, today)
    const input = { originLat, originLng }

    return {
      today: this.service.buildRoutePlanForOrders(this.toRouteOrders(todayOrders), input),
      missed: this.service.buildRoutePlanForOrders(this.toRouteOrders(missedOrders), input),
    }
  }

  /**
   * Returns the inspection queue ordered by arrival time.
   */
  async getInspectionQueue(): Promise<Order[]> {
    return Order.query().where('status', OrderStatus.IN_INSPECTION).orderBy('created_at', 'asc')
  }

  /**
   * Retrieves an order for a given task type, only matching
   * orders currently in the status that task type expects.
   */
  async getTaskOrder(orderNumber: string, type: TaskType): Promise<Order> {
    return Order.query()
      .where('order_number', orderNumber)
      .where('status', TASK_STATUS[type])
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

    await OrderAction.create({
      orderId: order.id,
      staffId: staff.id,
      name: ATTEMPT_ACTION[type],
      photoPath: null,
      note: null,
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

    const photoPath = await this.storePhoto(data.photo)

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
    const order = await this.getTaskOrder(orderNumber, ActionName.INSPECTION)
    const lock = this.resolveTaskLock(order, ActionName.INSPECTION)

    if (!lock || lock.staffId !== staff.id) {
      throw new vineErrors.E_VALIDATION_ERROR([
        {
          field: 'status',
          message: 'Anda tidak sedang memproses tugas ini.',
        },
      ])
    }

    const photoPath = await this.storePhoto(data.photo)

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
   * Releases a task lock previously claimed by the staff member.
   */
  async releaseTask(staff: User, orderNumber: string, type: TaskType): Promise<Order> {
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

    await OrderAction.create({
      orderId: order.id,
      staffId: staff.id,
      name: RELEASE_ACTION[type],
      photoPath: null,
      note: null,
    })

    return order
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
        const service = await Service.findOrFail(serviceId, { client: trx })
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
   * Stores an uploaded proof photo and returns a long-lived signed
   * URL for it, since the drive disk is configured as private.
   */
  private async storePhoto(photo: CompleteTaskData['photo']): Promise<string> {
    const key = `order-actions/${randomUUID()}.${photo.extname}`
    await drive.use().putStream(key, createReadStream(photo.tmpPath!))

    return drive.use().getSignedUrl(key, { expiresIn: '3650d' })
  }

  /**
   * Splits orders into today's schedule and overdue orders.
   */
  private splitOrdersByDate(orders: Order[], today: DateTime): [Order[], Order[]] {
    const todayOrders: Order[] = []
    const missedOrders: Order[] = []

    for (const order of orders) {
      if (order.pickupDate?.hasSame(today, 'day')) {
        todayOrders.push(order)
      } else {
        missedOrders.push(order)
      }
    }

    return [todayOrders, missedOrders]
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
