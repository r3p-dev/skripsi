import Address from '#models/address'
import { ActionName } from '#enums/order_action_enum'
import { OrderStatus } from '#enums/order_status_enum'
import { OrderType } from '#enums/order_type_enum'
import { PaymentMethod } from '#enums/transaction_enum'
import Order from '#models/order'
import OrderAction from '#models/order_action'
import Service from '#models/service'
import User from '#models/user'
import { Role } from '#enums/role_enum'
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
import BroadcastService from '#services/broadcast_service'

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
    private transactionService: TransactionService,
    private broadcastService: BroadcastService
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

    const order = await this.createWithUniqueOrderNumber((orderNumber) =>
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

    this.broadcastService.orderCreated(order)

    return order
  }

  /**
   * Creates an order recorded at the counter.
   *
   * Unlike a booked order, the shoes are already in the shop and the services
   * are already chosen, so there is no pickup to drive and no inspection to
   * schedule — the order starts in cleaning. Payment is taken on the spot:
   * cash and debit are marked paid immediately, while QRIS opens a Midtrans
   * charge for the customer to scan before they leave.
   *
   * Two things vary. The customer may already have an account, in which case
   * the order is bound to it and shows up in their own history rather than
   * being a stranger's row with the same phone number on it. And they may want
   * the shoes delivered back rather than collecting them, which needs an
   * address, which is why it needs the account.
   */
  async createOfflineOrder(staff: User, data: OfflineOrderData): Promise<Order> {
    const { customer, address } = await this.resolveWalkInCustomer(data)

    /**
     * Checked before anything is written. The total is only knowable once the
     * lines are priced, so this prices them without persisting — a payload
     * that does not cover the bill then leaves no photo on disk and no half-
     * built order behind it.
     */
    if (data.paymentMethod === PaymentMethod.CASH) {
      this.assertCashCoversTotal(data.cashReceived, await this.taskService.priceItems(data.items))
    }

    /**
     * A counter order never goes through inspection, so this is the only
     * record of what condition the shoes arrived in — which is the record any
     * later disagreement turns on.
     */
    const photoPath = await this.taskService.storePhoto('offline', data.photo)

    const createdOrder = await this.createWithUniqueOrderNumber((orderNumber) =>
      db.transaction(async (trx) => {
        const order = await Order.create(
          {
            userId: customer?.id ?? null,
            addressId: address?.id ?? null,
            customerName: data.name,
            customerPhone: data.phone,
            orderNumber,
            type: address ? OrderType.WALK_IN_DELIVERY : OrderType.OFFLINE,
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
            photoPath,
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
      await this.transactionService.createManualTransaction(
        createdOrder,
        data.paymentMethod,
        data.paymentMethod === PaymentMethod.CASH ? (data.cashReceived ?? null) : null
      )
    }

    this.broadcastService.orderCreated(createdOrder)

    return this.getOrderByNumber(createdOrder.orderNumber)
  }

  /**
   * Works out which account, if any, a counter order belongs to, and where it
   * should be delivered if the customer asked for that.
   *
   * Delivery is only offered to customers who already have an account with a
   * live address, because those are the only two things that make a delivery
   * possible. Staff typing a street into the order form would produce an
   * address nobody has pinned on a map and no route can be planned from.
   */
  private async resolveWalkInCustomer(
    data: OfflineOrderData
  ): Promise<{ customer: User | null; address: Address | null }> {
    if (!data.customerId) {
      if (data.delivery) {
        throw new vineErrors.E_VALIDATION_ERROR([
          {
            field: 'delivery',
            message: 'Pengantaran hanya tersedia untuk pelanggan yang sudah terdaftar.',
          },
        ])
      }

      return { customer: null, address: null }
    }

    const customer = await User.query()
      .where('id', data.customerId)
      .where('role', Role.CUSTOMER)
      .first()

    if (!customer) {
      throw new vineErrors.E_VALIDATION_ERROR([
        {
          field: 'customerId',
          message: 'Akun pelanggan tidak ditemukan.',
        },
      ])
    }

    if (!data.delivery) {
      return { customer, address: null }
    }

    const address = await Address.query()
      .where('user_id', customer.id)
      .where('is_active', true)
      .first()

    if (!address) {
      throw new vineErrors.E_VALIDATION_ERROR([
        {
          field: 'delivery',
          message: 'Pelanggan ini belum memiliki alamat aktif untuk pengantaran.',
        },
      ])
    }

    return { customer, address }
  }

  /**
   * Refuses a cash payment that does not cover the bill.
   *
   * The counter form works out the change as staff type, so this should never
   * fire from the interface — it is here because a payload that says the
   * customer handed over less than the total would otherwise be recorded as a
   * settled order with a negative amount of change owed.
   */
  private assertCashCoversTotal(cashReceived: number | undefined, totalPrice: number): void {
    if (cashReceived === undefined || cashReceived < totalPrice) {
      throw new vineErrors.E_VALIDATION_ERROR([
        {
          field: 'cashReceived',
          message: 'Uang yang diterima kurang dari total pesanan.',
        },
      ])
    }
  }

  /**
   * Finds registered customers by name or phone number, so staff serving a
   * walk-in can pick the account instead of typing the person in again.
   *
   * Capped hard and never returned for an empty search: this reads the whole
   * customer list, and a lookup box is not a place to browse it from.
   */
  async searchCustomers(term: string): Promise<User[]> {
    const search = term.trim()

    if (search.length < 3) {
      return []
    }

    return User.query()
      .where('role', Role.CUSTOMER)
      .where('is_active', true)
      .where((matches) => {
        matches.whereILike('name', `%${search}%`).orWhereILike('phone', `%${search}%`)
      })
      .orderBy('name', 'asc')
      .limit(10)
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

    this.broadcastService.orderUpdated(order)

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
