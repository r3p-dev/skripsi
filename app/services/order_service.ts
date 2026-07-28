import Address from '#models/address'
import { ActionName } from '#enums/order_action_enum'
import { OrderStatus } from '#enums/order_status_enum'
import { OrderType } from '#enums/order_type_enum'
import { PaymentMethod } from '#enums/transaction_enum'
import Order from '#models/order'
import OrderAction from '#models/order_action'
import Service from '#models/service'
import type User from '#models/user'
import type { OfflineOrderData, OrderData } from '#validators/order_validator'
import { Filters, OrderFilters } from '#validators/shared'
import { inject } from '@adonisjs/core'
import { EXPORT_ROW_LIMIT } from '#services/excel_service'
import db from '@adonisjs/lucid/services/db'
import type { ModelPaginatorContract } from '@adonisjs/lucid/types/model'
import { errors as vineErrors } from '@vinejs/vine'
import { DateTime } from 'luxon'
import TaskService from '#services/task_service'
import TransactionService from '#services/transaction_service'

/**
 * Maximum number of pickups that may be scheduled for a single day,
 * so the team is never booked beyond what it can actually collect.
 */
export const DAILY_PICKUP_LIMIT = 10

/**
 * How many times to regenerate an order number before giving up.
 *
 * Numbers are derived from the highest one issued today, so two orders created
 * in the same instant can read the same value. The unique index turns that into
 * a failed insert rather than a duplicate, and a retry simply reads the number
 * the winner just took. Three attempts is far beyond what this volume needs.
 */
const ORDER_NUMBER_ATTEMPTS = 3

/**
 * Postgres unique-violation error code.
 */
function isDuplicateOrderNumber(error: unknown): boolean {
  return (error as { code?: string })?.code === '23505'
}

/**
 * Manages customer order workflows: browsing, creating,
 * and cancelling orders.
 */
@inject()
export default class OrderService {
  constructor(
    private taskService: TaskService,
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
   * Retrieves every order for the admin monitor, scoped to nobody and
   * narrowable by status and type.
   *
   * Kept apart from `getAllOrders` because the two answer different
   * questions: that one is a customer looking through their own history and
   * is always scoped to them, this one is an operator looking at the shop.
   */
  async getMonitoredOrders(filters: OrderFilters): Promise<ModelPaginatorContract<Order>> {
    return this.monitoredOrdersQuery(filters).preload('address').paginate(filters.page, 10)
  }

  /**
   * The same list the monitor shows, unpaginated, for the spreadsheet export.
   *
   * Built on the same query as the screen so the file always contains exactly
   * what the filters above it describe — an export that quietly widened or
   * narrowed the list would be worse than no export. The transactions come
   * along because the file has room for a payment column the table does not.
   */
  async getMonitoredOrdersForExport(filters: OrderFilters): Promise<Order[]> {
    return this.monitoredOrdersQuery(filters)
      .preload('address')
      .preload('transactions', (transactionsQuery) => {
        transactionsQuery.orderBy('created_at', 'desc')
      })
      .limit(EXPORT_ROW_LIMIT)
  }

  private monitoredOrdersQuery(filters: OrderFilters) {
    const searchTerm = `%${filters.search}%`

    return Order.query()
      .if(filters.search, (query) => {
        query.where((matches) => {
          matches
            .whereILike('order_number', searchTerm)
            .orWhereILike('customer_name', searchTerm)
            .orWhereILike('customer_phone', searchTerm)
        })
      })
      .if(filters.status, (query) => {
        query.where('status', filters.status)
      })
      .if(filters.type, (query) => {
        query.where('type', filters.type)
      })
      .orderBy('created_at', 'desc')
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
   * Creates a new online order for the customer's chosen pickup date.
   *
   * Pickup capacity is limited per day to avoid exceeding
   * operational resources.
   *
   * The recipient's name and phone come from the pickup address, not from the
   * account: a customer may well be booking on behalf of someone else, and it
   * is whoever is at that door that staff need to ask for and call.
   */
  async createOnlineOrder(user: User, data: OrderData): Promise<Order> {
    /**
     * The address id arrives straight from the form, so it has to be checked
     * against this customer's own addresses. Without it, anyone could book a
     * pickup at a stranger's address by editing the hidden field.
     */
    const address = await Address.query()
      .where('id', data.addressId)
      .where('user_id', user.id)
      .first()

    if (!address) {
      throw new vineErrors.E_VALIDATION_ERROR([
        {
          field: 'addressId',
          message: 'Alamat penjemputan tidak ditemukan.',
        },
      ])
    }

    const scheduledPickups = await Order.query()
      .where('pickup_date', data.pickupDate.toFormat('yyyy-MM-dd'))
      .where('status', OrderStatus.PICKUP_SCHEDULED)

    if (scheduledPickups.length >= DAILY_PICKUP_LIMIT) {
      throw new vineErrors.E_VALIDATION_ERROR([
        {
          field: 'pickupDate',
          message: 'Batas penjemputan per hari sudah penuh untuk tanggal ini.',
        },
      ])
    }

    return this.createWithUniqueOrderNumber((orderNumber) =>
      Order.create({
        userId: user.id,
        customerName: address.name,
        customerPhone: address.phone,
        addressId: address.id,
        orderNumber,
        pickupDate: data.pickupDate,
        totalPrice: null,
        type: OrderType.ONLINE,
        status: OrderStatus.PICKUP_SCHEDULED,
      })
    )
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
    const createdOrder = await this.createWithUniqueOrderNumber((orderNumber) =>
      db.transaction(async (trx) => {
        const order = await Order.create(
          {
            userId: null,
            customerName: data.name,
            customerPhone: data.phone,
            orderNumber,
            type: OrderType.OFFLINE,
            status: OrderStatus.IN_CLEANING,
            totalPrice: null,
          },
          { client: trx }
        )

        const totalPrice = await this.taskService.createOrderItems(order, data.items, trx)

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
    )

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
   * Whether a customer may still cancel this order.
   *
   * Cancellation closes once the pickup day arrives, because staff may already
   * be on their way. Public so the order page can render the button in a
   * disabled state rather than hiding it, which leaves the rule visible.
   */
  canCancel(order: Order): boolean {
    const pickupDate = order.pickupDate?.startOf('day')
    const today = DateTime.now().startOf('day')

    return order.status === OrderStatus.PICKUP_SCHEDULED && !!pickupDate && pickupDate > today
  }

  /**
   * Cancels an order if it is still eligible for cancellation.
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

    await order.merge({ status: OrderStatus.CANCELLED }).save()

    return this.getOrderByNumber(order.orderNumber, user)
  }

  /**
   * Generates the next order number for today, in the format ORDYYMMDD-001.
   *
   * The numeric suffix restarts every day and is incremented from the
   * highest number already issued for the same day.
   */
  async generateOrderNumber(): Promise<string> {
    const prefix = `ORD${DateTime.now().toFormat('yyLLdd')}`

    const lastOrder = await Order.query()
      .where('order_number', 'like', `${prefix}-%`)
      .orderBy('order_number', 'desc')
      .first()

    const lastSequence = lastOrder ? Number.parseInt(lastOrder.orderNumber.split('-')[1], 10) : 0
    const nextSequence = String(lastSequence + 1).padStart(3, '0')

    return `${prefix}-${nextSequence}`
  }

  /**
   * Creates an order, regenerating its number and trying again if another
   * order claimed the same one first.
   *
   * Both creation paths go through here so a collision is never something the
   * customer or staff member sees — they get an order, not an error.
   */
  private async createWithUniqueOrderNumber(
    create: (orderNumber: string) => Promise<Order>
  ): Promise<Order> {
    let lastError: unknown

    for (let attempt = 0; attempt < ORDER_NUMBER_ATTEMPTS; attempt++) {
      try {
        return await create(await this.generateOrderNumber())
      } catch (error) {
        if (!isDuplicateOrderNumber(error)) {
          throw error
        }

        lastError = error
      }
    }

    throw lastError
  }
}
