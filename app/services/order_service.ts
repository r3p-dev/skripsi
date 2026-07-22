import { OrderStatus } from '#enums/order_status_enum'
import Order from '#models/order'
import type User from '#models/user'
import type { OrderData } from '#validators/order_validator'
import { Filters } from '#validators/shared'
import { inject } from '@adonisjs/core'
import db from '@adonisjs/lucid/services/db'
import type { ModelPaginatorContract } from '@adonisjs/lucid/types/model'
import { errors as vineErrors } from '@vinejs/vine'
import { DateTime } from 'luxon'
import RouteService from '#services/route_service'

/**
 * Manages customer and administrative order workflows.
 *
 * Responsibilities:
 * - Retrieve customer and administrative order listings.
 * - Retrieve detailed order information.
 * - Create new customer orders.
 * - Enforce order cancellation policies.
 * - Generate unique order numbers.
 */
@inject()
export default class OrderService {
  private readonly routeService = new RouteService()
  /**
   * Retrieve a paginated list of orders belonging to the authenticated customer.
   *
   * Results can be filtered using the provided search criteria and are sorted
   * by creation date in descending order. Related address information is
   * loaded to support order history and tracking views.
   *
   * @param user - Authenticated customer.
   * @param filters - Pagination and search filters.
   * @returns A paginated collection of the customer's orders.
   */
  async getAllCustomerOrders(user: User, filters: Filters): Promise<ModelPaginatorContract<Order>> {
    const searchTerm = `${filters.search}%`

    return Order.query()
      .where('user_id', user.id)
      .andWhereILike('order_number', searchTerm)
      .preload('address', (addressQuery) => {
        addressQuery
          .whereILike('recipient_name', searchTerm)
          .orWhereILike('recipient_phone', searchTerm)
          .orWhereILike('address_detail', searchTerm)
      })
      .orderBy('created_at', 'desc')
      .paginate(filters.page, 10)
  }

  /**
   * Retrieve a paginated list of all orders.
   *
   * This method is intended for administrative and operational workflows
   * where visibility across all customer orders is required.
   *
   * Results can be filtered using the provided search criteria and are sorted
   * by creation date in descending order.
   *
   * @param filters - Pagination and search filters.
   * @returns A paginated collection of orders.
   */
  async getAllOrders(filters: Filters): Promise<ModelPaginatorContract<Order>> {
    const searchTerm = `${filters.search}%`

    return Order.query()
      .andWhereILike('order_number', searchTerm)
      .preload('address', (addressQuery) => {
        addressQuery
          .whereILike('recipient_name', searchTerm)
          .orWhereILike('recipient_phone', searchTerm)
          .orWhereILike('address_detail', searchTerm)
      })
      .orderBy('created_at', 'desc')
      .paginate(filters.page, 10)
  }

  /**
   * Retrieve a specific order owned by the authenticated customer.
   *
   * The order is loaded together with its related address, items, services,
   * staff actions, and transaction history.
   *
   * Ownership validation is enforced to ensure customers can only access
   * their own orders.
   *
   * @param user - Authenticated customer.
   * @param orderNumber - Unique order identifier.
   * @returns The matching customer order with its related data.
   * @throws When the order cannot be found or does not belong to the customer.
   */
  async getCustomerOrderByNumber(user: User, orderNumber: string): Promise<Order> {
    return Order.query()
      .where('order_number', orderNumber)
      .andWhere('user_id', user.id)
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
   * Retrieve a specific order by its order number.
   *
   * The order is loaded together with its related address, items, services,
   * staff actions, and transaction history.
   *
   * This method is intended for administrative and operational use cases
   * where ownership restrictions are not applied.
   *
   * @param orderNumber - Unique order identifier.
   * @returns The matching order with its related data.
   * @throws When the order cannot be found.
   */
  async getOrderByNumber(orderNumber: string): Promise<Order> {
    return Order.query()
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
   * Create a new customer order and schedule an item pickup.
   *
   * A unique order number is generated automatically and the order is created
   * with an initial status indicating that pickup has been scheduled.
   *
   * The operation is executed within a database transaction to ensure
   * consistency during order creation.
   *
   * @param user - Authenticated customer.
   * @param data - Validated order creation payload.
   * @returns The newly created order.
   */
  async createOnlineOrder(user: User, data: OrderData): Promise<Order> {
    const pickupDate = data.date instanceof DateTime ? data.date : DateTime.fromJSDate(data.date)
    const pickupDateValue = pickupDate.toFormat('yyyy-MM-dd')
    const limit = 10

    const existingPickupOrders = await Order.query()
      .where('pickup_date', pickupDateValue)
      .where('status', OrderStatus.PICKUP_SCHEDULED)

    if (
      this.hasReachedDailyOrderLimit(
        existingPickupOrders,
        pickupDate,
        limit,
        OrderStatus.PICKUP_SCHEDULED
      )
    ) {
      throw new vineErrors.E_VALIDATION_ERROR([
        {
          field: 'date',
          message: 'Batas penjemputan per hari sudah penuh untuk tanggal ini.',
        },
      ])
    }

    const order = await db.transaction(async (trx) => {
      const number = await this.generateOrderNumber()

      return Order.create(
        {
          userId: user.id,
          addressId: data.addressId,
          orderNumber: number,
          pickupDate,
          totalPrice: null,
          status: OrderStatus.PICKUP_SCHEDULED,
        },
        { client: trx }
      )
    })

    return order
  }

  /**
   * Build the combined pickup and delivery route plan for the selected day.
   *
   * @param selectedDate - The date for which the route should be generated.
   * @param originLat - Starting latitude for the route.
   * @param originLng - Starting longitude for the route.
   * @returns A sorted route plan for staff.
   */
  async getUnifiedRoutePlanForDate(selectedDate: DateTime, originLat: number, originLng: number) {
    const selectedDateValue = selectedDate.toFormat('yyyy-MM-dd')

    const orders = await Order.query()
      .where('pickup_date', selectedDateValue)
      .whereIn('status', [OrderStatus.PICKUP_SCHEDULED, OrderStatus.IN_DELIVERY])
      .preload('address')

    return this.routeService.buildRoutePlanForOrders(
      orders.map((order) => ({
        id: order.id,
        orderNumber: order.orderNumber,
        pickupDate: order.pickupDate,
        status: order.status,
        address: order.address
          ? {
              latitude: order.address.latitude,
              longitude: order.address.longitude,
            }
          : null,
      })),
      {
        originLat,
        originLng,
        selectedDate,
      }
    )
  }

  /**
   * Check whether the daily limit for a given order status has been reached.
   *
   * @param orders - Orders to evaluate for the selected day.
   * @param selectedDate - The target date for the evaluation.
   * @param limit - Maximum allowed orders for the day.
   * @param status - Order status to evaluate.
   * @returns `true` when the limit has been reached; otherwise `false`.
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
   * Cancel a customer order that has not yet reached its pickup date.
   *
   * Orders may only be cancelled while they remain in the pickup scheduled
   * state and the scheduled pickup date is later than the current day.
   *
   * Cancellation requests that violate these business rules are rejected.
   *
   * @param user - Authenticated customer.
   * @param orderNumber - Unique order identifier.
   * @returns The updated order after cancellation.
   * @throws {vineErrors.E_VALIDATION_ERROR}
   * Thrown when the order is no longer eligible for cancellation.
   */
  async cancelOrder(user: User, orderNumber: string): Promise<Order> {
    const order = await this.getCustomerOrderByNumber(user, orderNumber)

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

    return this.getCustomerOrderByNumber(user, cancelledOrder.orderNumber)
  }

  /**
   * Determine whether an order is eligible for customer cancellation.
   *
   * Orders can only be cancelled when:
   * - The current status is pickup scheduled.
   * - The pickup date occurs after the current day.
   *
   * @param order - Order being evaluated.
   * @returns `true` when the order can still be cancelled; otherwise `false`.
   * @private
   * */
  private canCancel(order: Order): boolean {
    const pickupDate = order.pickupDate?.startOf('day')
    const today = DateTime.now().startOf('day')

    return order.status === OrderStatus.PICKUP_SCHEDULED && pickupDate! > today
  }

  /**
   * Generate the next order number for the current day.
   *
   * Order numbers follow the format:
   *
   * ORDYYMMDD-001
   *
   * where the numeric suffix is incremented sequentially for orders created
   * on the same day.
   *
   * @returns A unique order number for the current date.
   */
  async generateOrderNumber(): Promise<string> {
    const prefix = `ORD${DateTime.now().toFormat('yyLLdd')}`
    const lastOrder = await this.getLastOrderForDay(prefix)
    const nextIncrement = this.calculateNextIncrement(lastOrder)

    return `${prefix}-${this.formatIdentifier(nextIncrement)}`
  }

  /**
   * Retrieve the most recently generated order for a specific daily prefix.
   *
   * This method is used to determine the next sequence number when generating
   * new order identifiers.
   *
   * @param prefix - Daily order number prefix.
   * @returns The most recently created matching order, or `null` when no
   * orders exist for the specified prefix.
   * @private
   */
  private async getLastOrderForDay(prefix: string): Promise<Order | null> {
    return Order.query()
      .where('order_number', 'like', `${prefix}-%`)
      .orderBy('order_number', 'desc')
      .first()
  }

  /**
   * Calculate the next sequence number for a daily order identifier.
   *
   * When no previous order exists for the day, numbering starts from 1.
   *
   * @param lastOrder - Most recent order associated with the daily prefix.
   * @returns The next available sequence number.
   * @private
   */
  private calculateNextIncrement(lastOrder: Order | null): number {
    if (!lastOrder) return 1

    const lastNumber = lastOrder.orderNumber.split('-')[1]
    return Number.parseInt(lastNumber, 10) + 1
  }

  /**
   * Convert a numeric sequence value into a fixed-width identifier.
   *
   * Sequence values are left-padded with zeros to maintain a consistent
   * three-digit order number suffix.
   *
   * Example:
   * - 1 → 001
   * - 12 → 012
   * - 123 → 123
   *
   * @param increment - Numeric sequence value.
   * @returns A zero-padded sequence identifier.
   * @private
   */
  private formatIdentifier(increment: number): string {
    return increment.toString().padStart(3, '0')
  }
}
