import type Order from '#models/order'
import type { TransactionStatus } from '#enums/transaction_enum'
import transmit from '@adonisjs/transmit/services/main'

/**
 * The channel a customer's own order page listens on, so the status moves
 * under them while a staff member works.
 */
export function orderChannel(orderNumber: string): string {
  return `orders/${orderNumber}`
}

/**
 * The single channel the admin screens listen on.
 *
 * Deliberately one channel carrying three events rather than a live feed of
 * everything that happens in the shop. An admin needs to know when work
 * arrives, when it moves, and when money lands — the rest is detail they go
 * and look at, and pushing all of it would turn the dashboard into a firehose
 * that nobody can leave open.
 */
export const ADMIN_ORDERS_CHANNEL = 'admin/orders'

export const AdminOrderEvent = {
  /** A new order was booked or recorded at the counter. */
  CREATED: 'order:created',
  /** An existing order moved to a different status. */
  UPDATED: 'order:updated',
  /** An order's payment settled. */
  PAID: 'order:paid',
} as const

export type AdminOrderEvent = (typeof AdminOrderEvent)[keyof typeof AdminOrderEvent]

/**
 * Pushes order activity to the people watching it live.
 *
 * Every payload carries stored values — statuses, types, amounts — and never
 * the Indonesian wording for them. A broadcast is data arriving at a screen
 * that already knows how to print it; baking the label in here would mean two
 * places decide what a status is called and one of them eventually drifts.
 */
export default class BroadcastService {
  /**
   * Tells a customer's open order page that something changed.
   */
  orderChanged(order: Order, transactionStatus?: TransactionStatus): void {
    transmit.broadcast(orderChannel(order.orderNumber), {
      orderStatus: order.status,
      transactionStatus: transactionStatus ?? null,
    })
  }

  /**
   * Tells the admin screens a new order came in.
   */
  orderCreated(order: Order): void {
    this.toAdmin(AdminOrderEvent.CREATED, order)
  }

  /**
   * Tells the admin screens an order moved on.
   */
  orderUpdated(order: Order): void {
    this.toAdmin(AdminOrderEvent.UPDATED, order)
  }

  /**
   * Tells the admin screens an order's money landed.
   */
  orderPaid(order: Order): void {
    this.toAdmin(AdminOrderEvent.PAID, order)
  }

  private toAdmin(event: AdminOrderEvent, order: Order): void {
    transmit.broadcast(ADMIN_ORDERS_CHANNEL, {
      event,
      orderNumber: order.orderNumber,
      customerName: order.customerName,
      status: order.status,
      type: order.type,
      totalPrice: order.totalPrice === null ? null : Number(order.totalPrice),
    })
  }
}
