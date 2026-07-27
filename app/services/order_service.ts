import { ActionName } from '#enums/order_action_enum'
import { OrderStatus } from '#enums/order_status_enum'
import { PaymentMethod } from '#enums/transaction_enum'
import Order from '#models/order'
import OrderAction from '#models/order_action'
import Service from '#models/service'
import type User from '#models/user'
import type { OfflineOrderData, OrderData } from '#validators/order_validator'
import { Filters } from '#validators/shared'
import { inject } from '@adonisjs/core'
import db from '@adonisjs/lucid/services/db'
import type { ModelPaginatorContract } from '@adonisjs/lucid/types/model'
import { errors as vineErrors } from '@vinejs/vine'
import { DateTime } from 'luxon'
import TaskService from '#services/task_service'
import TransactionService from '#services/transaction_service'

/**
 * Manages customer order workflows: browsing, creating,
 * and cancelling orders.
 */
@inject()
export default class OrderService {
  constructor(
    private service: TaskService,
    private transactionService: TransactionService
  ) {}

  /**
   * Retrieves customer orders with
   * optional search and pagination.
   */
  async getAllOrders(filters: Filters, user?: User): Promise<ModelPaginatorContract<Order>> {
    const searchTerm = `${filters.search}%`

    return Order.query()
      .if(user, (query) => {
        query.where('user_id', user!.id)
      })
      .andWhereILike('order_number', searchTerm)
      .preload('address', (query) => {
        query
          .whereILike('name', searchTerm)
          .orWhereILike('phone', searchTerm)
          .orWhereILike('street', searchTerm)
      })
      .orderBy('created_at', 'desc')
      .paginate(filters.page, 10)
  }

  /**
   * Retrieves an order together with all related data.
   */
  async getOrderByNumber(orderNumber: string, user?: User): Promise<Order> {
    return Order.query()
      .if(user, (query) => {
        query.where('user_id', user!.id)
      })
      .where('order_number', orderNumber)
      .preload('address')
      .preload('items', (itemsQuery) => {
        itemsQuery.preload('service').preload('item')
      })
      .preload('actions', (actionsQuery) => {
        actionsQuery.preload('staff')
      })
      .preload('transactions')
      .firstOrFail()
  }

  /**
   * Creates a new online order.
   *
   * Pickup capacity is limited per day to avoid exceeding
   * operational resources.
   */
  async createOnlineOrder(user: User, data: OrderData): Promise<Order> {
    const pickupDateValue = data.pickupDate.toFormat('yyyy-MM-dd')
    const limit = 10

    const existingPickupOrders = await Order.query()
      .where('pickup_date', pickupDateValue)
      .where('status', OrderStatus.PICKUP_SCHEDULED)

    if (
      this.hasReachedDailyOrderLimit(
        existingPickupOrders,
        data.pickupDate,
        limit,
        OrderStatus.PICKUP_SCHEDULED
      )
    ) {
      throw new vineErrors.E_VALIDATION_ERROR([
        {
          field: 'pickupDate',
          message: 'Batas penjemputan per hari sudah penuh untuk tanggal ini.',
        },
      ])
    }

    return db.transaction(async (trx) => {
      const orderNumber = await this.generateOrderNumber()

      return Order.create(
        {
          userId: user.id,
          customerName: user.name,
          customerPhone: user.phone,
          addressId: data.addressId,
          orderNumber,
          pickupDate: data.pickupDate,
          totalPrice: null,
          status: OrderStatus.PICKUP_SCHEDULED,
        },
        { client: trx }
      )
    })
  }

  /**
   * Creates an offline order.
   *
   * Unlike online orders, shoe details and selected services
   * are already known, allowing the order to skip pickup,
   * inspection, and payment waiting stages. Payment is collected
   * immediately: cash and debit are marked paid on the spot, while
   * QRIS starts a Midtrans payment for the customer to scan.
   */
  async createOfflineOrder(staff: User, data: OfflineOrderData): Promise<Order> {
    const createdOrder = await db.transaction(async (trx) => {
      const orderNumber = await this.generateOrderNumber()

      const order = await Order.create(
        {
          userId: null,
          customerName: data.name,
          customerPhone: data.phone,
          orderNumber,
          status: OrderStatus.IN_CLEANING,
          totalPrice: null,
        },
        { client: trx }
      )

      const totalPrice = await this.service.createOrderItems(order, data.items, trx)

      await order.merge({ totalPrice }).useTransaction(trx).save()

      await OrderAction.create(
        {
          orderId: order.id,
          staffId: staff.id,
          name: ActionName.OFFLINE_ORDER,
          photoPath: null,
          note: data.note ?? null,
        },
        { client: trx }
      )

      return order
    })

    if (data.paymentMethod === PaymentMethod.QRIS) {
      await this.transactionService.createQrisTransaction(createdOrder)
    } else {
      await this.transactionService.createManualTransaction(createdOrder, data.paymentMethod)
    }

    return this.getOrderByNumber(createdOrder.orderNumber)
  }

  /**
   * Returns all available cleaning services.
   */
  async getAvailableServices(): Promise<Service[]> {
    return Service.query().orderBy('created_at', 'asc')
  }

  /**
   * Determines whether the daily pickup capacity has been reached.
   */
  hasReachedDailyOrderLimit(
    orders: Order[],
    selectedDate: DateTime,
    limit = 10,
    status: string = OrderStatus.PICKUP_SCHEDULED
  ): boolean {
    const scheduledCount = orders.filter((order) => {
      if (order.status !== status) {
        return false
      }

      const pickupDate = order.pickupDate?.startOf('day')

      return pickupDate?.hasSame(selectedDate.startOf('day'), 'day')
    }).length

    return scheduledCount >= limit
  }

  /**
   * Cancels an order if it is still eligible for cancellation.
   *
   * Customers may only cancel orders before the scheduled
   * pickup date while the order is still waiting for pickup.
   */
  async cancelOrder(user: User, orderNumber: string): Promise<Order> {
    const order = await this.getOrderByNumber(orderNumber, user)

    if (!this.canCancel(order)) {
      throw new vineErrors.E_VALIDATION_ERROR([
        {
          field: 'status',
          message: 'Pesanan hanya dapat dibatalkan sebelum tanggal penjemputan.',
        },
      ])
    }

    const cancelledOrder = await db.transaction((trx) =>
      order.merge({ status: OrderStatus.CANCELLED }).useTransaction(trx).save()
    )

    return this.getOrderByNumber(cancelledOrder.orderNumber, user)
  }

  /**
   * Checks whether an order is still eligible
   * for customer cancellation.
   */
  private canCancel(order: Order): boolean {
    const pickupDate = order.pickupDate?.startOf('day')
    const today = DateTime.now().startOf('day')

    return order.status === OrderStatus.PICKUP_SCHEDULED && pickupDate! > today
  }

  /**
   * Generates the next order number using the format:
   *
   * ORDYYMMDD-001
   *
   * The numeric suffix is incremented sequentially
   * for each order created on the same day.
   */
  async generateOrderNumber(): Promise<string> {
    const prefix = `ORD${DateTime.now().toFormat('yyLLdd')}`
    const lastOrder = await this.getLastOrderForDay(prefix)
    const nextIncrement = this.calculateNextIncrement(lastOrder)

    return `${prefix}-${this.formatIdentifier(nextIncrement)}`
  }

  /**
   * Retrieves the latest order matching today's prefix.
   */
  private async getLastOrderForDay(prefix: string): Promise<Order | null> {
    return Order.query()
      .where('order_number', 'like', `${prefix}-%`)
      .orderBy('order_number', 'desc')
      .first()
  }

  /**
   * Calculates the next sequence number
   * for today's order prefix.
   */
  private calculateNextIncrement(lastOrder: Order | null): number {
    if (!lastOrder) return 1

    const lastNumber = lastOrder.orderNumber.split('-')[1]
    return Number.parseInt(lastNumber, 10) + 1
  }

  /**
   * Formats the sequence number as a
   * three-digit identifier.
   */
  private formatIdentifier(increment: number): string {
    return increment.toString().padStart(3, '0')
  }
}
