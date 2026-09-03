import AddressService from '#services/address_service'
import CatalogueService from '#services/catalogue_service'
import OrderService from '#services/order_service'
import RoutingService, { type RouteLine, type RoutePoint } from '#services/routing_service'
import Item from '#models/item'
import Order from '#models/order'
import OrderAction from '#models/order_action'
import OrderItem from '#models/order_item'
import Transaction from '#models/transaction'
import UserModel from '#models/user'
import type User from '#models/user'
import OrderCreated from '#events/order_created'
import OrderPriceCorrected from '#events/order_price_corrected'
import { dispatch } from '#utils/events'
import { ActionName } from '#enums/order_action_enum'
import { OrderStatus, OrderType, WALK_IN_TYPES } from '#enums/order_enum'
import { Role } from '#enums/role_enum'
import { TransactionStatus } from '#enums/transaction_enum'
import { CLAIM_DURATION_HOURS, TASK_SOURCE_STATUS, TaskType, type TripType } from '#enums/task_enum'
import type {
  InspectedItemData,
  InspectionData,
  OfflineOrderData,
  OrderItemsData,
} from '#validators/task_validator'
import { errors as vineErrors } from '@vinejs/vine'
import { inject } from '@adonisjs/core'
import drive from '@adonisjs/drive/services/main'
import logger from '@adonisjs/core/services/logger'
import { randomUUID } from 'node:crypto'
import type { MultipartFile } from '@adonisjs/core/bodyparser'
import db from '@adonisjs/lucid/services/db'
import type { ModelQueryBuilderContract } from '@adonisjs/lucid/types/model'
import type { TransactionClientContract } from '@adonisjs/lucid/types/database'
import { DateTime } from 'luxon'

export type RouteItem = {
  id: number
  orderNumber: string
  type: TripType
  pickupDate: DateTime | null
  distanceMetres: number
}

const PHOTO_DIRECTORY = 'order-actions'

export const TASK_TAKEN_MESSAGE =
  'Pesanan ini sudah diambil petugas lain. Silakan pilih pesanan lain.'

const COMPLETION_STATUS: Record<TripType, OrderStatus> = {
  [TaskType.PICKUP]: OrderStatus.IN_PICKUP,
  [TaskType.DELIVERY]: OrderStatus.COMPLETED,
}

const COMPLETION_ACTION: Record<TripType, ActionName> = {
  [TaskType.PICKUP]: ActionName.PICKUP,
  [TaskType.DELIVERY]: ActionName.DELIVERY,
}

const CLAIMABLE_TASKS: readonly TaskType[] = [
  TaskType.PICKUP,
  TaskType.DELIVERY,
  TaskType.INSPECTION,
]

@inject()
export default class TaskService {
  constructor(
    protected addressService: AddressService,
    protected catalogueService: CatalogueService,
    protected orderService: OrderService,
    protected routingService: RoutingService
  ) {}

  async getTripQueue(user: User): Promise<RouteItem[]> {
    const orders = await this.#claimableQuery(user)
      .whereIn('status', [OrderStatus.PICKUP_SCHEDULED, OrderStatus.IN_DELIVERY])
      .whereNotNull('address_id')
      .preload('address')
      .orderBy('pickup_date', 'asc')

    const stops = orders
      .filter((order) => order.address)
      .map((order) => ({
        order,
        latitude: Number(order.address.latitude),
        longitude: Number(order.address.longitude),
      }))

    if (stops.length === 0) {
      return []
    }

    const plan = await this.routingService.plan(await this.depot(stops[0]), stops)

    return plan.stops.map(({ stop, distance }) => ({
      id: stop.order.id,
      orderNumber: stop.order.orderNumber,
      type:
        stop.order.status === OrderStatus.PICKUP_SCHEDULED ? TaskType.PICKUP : TaskType.DELIVERY,
      pickupDate: stop.order.pickupDate,
      distanceMetres: distance,
    }))
  }

  async getInspectionQueue(user: User): Promise<Order[]> {
    return this.#claimableQuery(user)
      .where('status', TASK_SOURCE_STATUS[TaskType.INSPECTION])
      .orderBy('updated_at', 'asc')
  }

  async getCleaningQueue(): Promise<Order[]> {
    return Order.query()
      .where('status', TASK_SOURCE_STATUS[TaskType.CLEANING])
      .preload('items')
      .preload('actions')
      .orderBy('updated_at', 'asc')
  }

  async getCollectionQueue(): Promise<Order[]> {
    return Order.query()
      .where('status', TASK_SOURCE_STATUS[TaskType.COLLECTION])
      .preload('items')
      .preload('actions')
      .orderBy('updated_at', 'asc')
  }

  async findSummaryByNumber(orderNumber: string): Promise<Order> {
    return Order.query().where('order_number', orderNumber).firstOrFail()
  }

  async findByNumber(orderNumber: string): Promise<Order> {
    return Order.query()
      .where('order_number', orderNumber)
      .preload('address')
      .preload('items', (itemsQuery) => {
        itemsQuery.preload('orderItems').orderBy('id', 'asc')
      })
      .preload('actions', (actionsQuery) => {
        actionsQuery.preload('staff').orderBy('id', 'asc')
      })
      .firstOrFail()
  }

  async claim(user: User, order: Order, task: TaskType): Promise<boolean> {
    if (!CLAIMABLE_TASKS.includes(task)) {
      return true
    }

    if (order.status !== TASK_SOURCE_STATUS[task]) {
      return false
    }

    const claimed = await db
      .from('orders')
      .where('id', order.id)
      .where('status', TASK_SOURCE_STATUS[task])
      .where((query) => {
        query
          .whereNull('claimed_by')
          .orWhere('claimed_by', user.id)
          .orWhere('claimed_at', '<', this.#claimFloor().toJSDate())
      })
      .update(
        {
          claimed_by: user.id,
          claimed_task: task,
          claimed_at: DateTime.now().toJSDate(),
        },
        ['id']
      )

    if (claimed.length === 0) {
      return false
    }

    await order.refresh()

    return true
  }

  async release(user: User, order: Order): Promise<void> {
    if (order.claimedBy !== user.id) {
      return
    }

    await this.#clearClaim(order)
  }

  isBlocked(user: User, order: Order): boolean {
    if (order.claimedBy === null || order.claimedBy === user.id) {
      return false
    }

    return !!order.claimedAt && order.claimedAt > this.#claimFloor()
  }

  holds(user: User, order: Order): boolean {
    return order.claimedBy === user.id && !!order.claimedAt && order.claimedAt > this.#claimFloor()
  }

  canEditItems(order: Order): boolean {
    return order.status === OrderStatus.AWAITING_PAYMENT
  }

  isCounterOrder(order: Order): boolean {
    return WALK_IN_TYPES.includes(order.type)
  }

  async completeTrip(
    user: User,
    order: Order,
    type: TripType,
    photo: MultipartFile
  ): Promise<Order> {
    this.#assertHolder(user, order)

    return db.transaction(async (trx) => {
      await this.orderService.transitionTo(order, COMPLETION_STATUS[type], trx)

      const photoPath = await this.#storePhoto(photo, trx)

      await this.#recordAction(order, user, COMPLETION_ACTION[type], trx, photoPath)
      await this.#clearClaim(order, trx)

      return order
    })
  }

  async completeInspection(user: User, order: Order, data: InspectionData): Promise<Order> {
    this.#assertHolder(user, order)

    const catalogues = await this.catalogueService.resolveForSelections(data.items)

    return db.transaction(async (trx) => {
      await Item.query({ client: trx }).where('order_id', order.id).delete()

      let total = 0

      for (const entry of data.items) {
        total += await this.#recordInspectedItem(order, entry, catalogues, trx)
      }

      order.merge({ totalPrice: total.toString() })
      order.useTransaction(trx)
      await order.save()

      await this.orderService.transitionTo(order, OrderStatus.AWAITING_PAYMENT, trx)

      const photoPath = await this.#storePhoto(data.photo, trx)

      await this.#recordAction(order, user, ActionName.INSPECTION, trx, photoPath)
      await this.#clearClaim(order, trx)

      return order
    })
  }

  async completeCleaning(user: User, order: Order, photo: MultipartFile): Promise<Order> {
    const [next] = this.orderService.nextStatuses(order)

    if (!next) {
      throw new vineErrors.E_VALIDATION_ERROR([
        { field: 'form', message: 'Pesanan ini tidak sedang dalam pencucian.' },
      ])
    }

    return db.transaction(async (trx) => {
      await this.orderService.transitionTo(order, next, trx)

      const photoPath = await this.#storePhoto(photo, trx)

      await this.#recordAction(order, user, ActionName.CLEANING_DONE, trx, photoPath)

      return order
    })
  }

  awaitsDelivery(order: Order): boolean {
    return order.status === OrderStatus.IN_DELIVERY
  }

  async completeCollection(user: User, order: Order, photo: MultipartFile): Promise<Order> {
    return db.transaction(async (trx) => {
      await this.orderService.transitionTo(order, OrderStatus.COMPLETED, trx)

      const photoPath = await this.#storePhoto(photo, trx)

      await this.#recordAction(order, user, ActionName.COLLECTED, trx, photoPath)

      return order
    })
  }

  async createOfflineOrder(user: User, data: OfflineOrderData): Promise<Order> {
    const catalogues = await this.catalogueService.resolveForSelections(data.items)
    const address = await this.#resolveCounterAddress(data)

    const order = await this.orderService.createWithUniqueOrderNumber((orderNumber) =>
      db.transaction(async (trx) => {
        const created = await Order.create(
          {
            userId: data.customerId ?? null,
            addressId: address?.id ?? null,
            customerName: data.name,
            customerPhone: data.phone,
            orderNumber,
            pickupDate: null,
            type: address ? OrderType.WALK_IN_DELIVERY : OrderType.OFFLINE,
            status: OrderStatus.IN_CLEANING,
            totalPrice: null,
          },
          { client: trx }
        )

        let total = 0

        for (const entry of data.items) {
          total += await this.#recordInspectedItem(created, entry, catalogues, trx)
        }

        created.merge({ totalPrice: total.toString() })
        created.useTransaction(trx)
        await created.save()

        await Transaction.create(
          {
            orderId: created.id,
            paymentMethod: data.paymentMethod,
            status: TransactionStatus.PAID,
            cashReceived: data.cashReceived?.toString() ?? null,
            midtransOrderId: null,
            midtransTransactionId: null,
            qrCode: null,
          },
          { client: trx }
        )

        const photoPath = await this.#storePhoto(data.photo, trx)

        await this.#recordAction(created, user, ActionName.OFFLINE_ORDER, trx, photoPath, data.note)

        return created
      })
    )

    await dispatch(OrderCreated, new OrderCreated(order))

    return order
  }

  async updateOrderItems(order: Order, data: OrderItemsData): Promise<Order> {
    if (order.status !== OrderStatus.AWAITING_PAYMENT) {
      throw new vineErrors.E_VALIDATION_ERROR([
        {
          field: 'form',
          message: 'Barang hanya dapat diubah selagi pesanan menunggu pelunasan.',
        },
      ])
    }

    const catalogues = await this.catalogueService.resolveForSelections(data.items)

    return db.transaction(async (trx) => {
      await Item.query({ client: trx }).where('order_id', order.id).delete()

      let total = 0

      for (const entry of data.items) {
        total += await this.#recordInspectedItem(order, entry, catalogues, trx)
      }

      order.merge({ totalPrice: total.toString() })
      order.useTransaction(trx)
      await order.save()

      await dispatch(OrderPriceCorrected, new OrderPriceCorrected(order), trx)

      return order
    })
  }

  async findCustomers(search: string): Promise<User[]> {
    const term = search.trim()

    if (term.length < 3) {
      return []
    }

    return UserModel.query()
      .where('role', Role.CUSTOMER)
      .where('is_active', true)
      .where((query) => {
        query.whereILike('name', `%${term}%`).orWhereILike('phone', `%${term}%`)
      })
      .orderBy('name', 'asc')
      .limit(10)
  }

  changeFor(order: Order, transaction: Transaction | null): number {
    if (!transaction?.cashReceived) {
      return 0
    }

    return Math.max(0, Number(transaction.cashReceived) - Number(order.totalPrice ?? 0))
  }

  async #resolveCounterAddress(data: OfflineOrderData) {
    if (!data.delivery) {
      return null
    }

    const customer = data.customerId ? await UserModel.find(data.customerId) : null

    if (!customer) {
      throw new vineErrors.E_VALIDATION_ERROR([
        {
          field: 'delivery',
          message: 'Pengantaran memerlukan akun pelanggan. Pilih akun terlebih dahulu.',
        },
      ])
    }

    const address = await this.addressService.getActiveAddress(customer)

    if (!address) {
      throw new vineErrors.E_VALIDATION_ERROR([
        {
          field: 'delivery',
          message: 'Akun pelanggan ini belum memiliki alamat tersimpan.',
        },
      ])
    }

    return address
  }

  async #recordInspectedItem(
    order: Order,
    entry: InspectedItemData,
    catalogues: Map<number, { id: number; name: string; price: string }>,
    trx: TransactionClientContract
  ): Promise<number> {
    const item = await Item.create(
      {
        orderId: order.id,
        type: entry.type,
        brand: entry.brand,
        model: entry.model,
        size: entry.size,
        material: entry.material,
        note: entry.note ?? null,
      },
      { client: trx }
    )

    const chosen = [entry.catalogue, ...(entry.additionalCatalogues ?? [])]

    const lines = chosen.map((catalogueId) => {
      const catalogue = catalogues.get(catalogueId)!

      return {
        orderId: order.id,
        itemId: item.id,
        catalogueId: catalogue.id,
        name: catalogue.name,
        condition: entry.condition,
        price: catalogue.price,
        subtotal: Number(catalogue.price).toString(),
      }
    })

    await OrderItem.createMany(lines, { client: trx })

    return lines.reduce((total, line) => total + Number(line.subtotal), 0)
  }

  async depot(fallback: RoutePoint): Promise<RoutePoint> {
    return (await this.addressService.getOperationalAreaCentroid()) ?? fallback
  }

  async routeTo(order: Order): Promise<RouteLine | null> {
    if (!order.address) {
      return null
    }

    const destination = {
      latitude: Number(order.address.latitude),
      longitude: Number(order.address.longitude),
    }

    return this.routingService.line(await this.depot(destination), destination)
  }

  #claimableQuery(user: User): ModelQueryBuilderContract<typeof Order, Order> {
    return Order.query().where((query) => {
      query
        .whereNull('claimed_by')
        .orWhere('claimed_by', user.id)
        .orWhere('claimed_at', '<', this.#claimFloor().toJSDate())
    })
  }

  #claimFloor(): DateTime {
    return DateTime.now().minus({ hours: CLAIM_DURATION_HOURS })
  }

  #assertHolder(user: User, order: Order): void {
    if (this.isBlocked(user, order)) {
      throw new vineErrors.E_VALIDATION_ERROR([
        { field: 'form', message: 'Tugas ini sedang ditangani oleh petugas lain.' },
      ])
    }
  }

  async #clearClaim(order: Order, trx?: TransactionClientContract): Promise<void> {
    order.merge({ claimedBy: null, claimedTask: null, claimedAt: null })

    if (trx) {
      order.useTransaction(trx)
    }

    await order.save()
  }

  async #recordAction(
    order: Order,
    user: User,
    name: ActionName,
    trx?: TransactionClientContract,
    photoPath: string | null = null,
    note: string | null = null
  ): Promise<OrderAction> {
    return OrderAction.create(
      {
        orderId: order.id,
        userId: user.id,
        name,
        photoPath,
        note,
      },
      trx ? { client: trx } : {}
    )
  }

  async #storePhoto(photo: MultipartFile, trx: TransactionClientContract): Promise<string> {
    const key = `${PHOTO_DIRECTORY}/${randomUUID()}.${photo.extname}`

    await photo.moveToDisk(key)

    trx.after('rollback', () => this.#discardPhoto(key))

    return key
  }

  async #discardPhoto(key: string): Promise<void> {
    try {
      await drive.use().delete(key)
    } catch (error) {
      logger.warn({ err: error, photo: key }, 'Could not remove the photo of a failed task')
    }
  }
}
