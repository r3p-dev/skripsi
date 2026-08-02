import type Order from '#models/order'
import AddressTransformer from '#transformers/address_transformer'
import OrderItemTransformer from '#transformers/order_item_transformer'
import UserTransformer from '#transformers/user_transformer'
import { BaseTransformer } from '@adonisjs/core/transformers'
import OrderActionTransformer from '#transformers/order_action_transformer'
import TransactionTransformer from '#transformers/transaction_transformer'

export default class OrderTransformer extends BaseTransformer<Order> {
  /**
   * The order's own columns and nothing else.
   *
   * Statuses, types, money and dates all go out as they are stored. Screens
   * differ in how they print them — a badge, a table cell, a printed receipt —
   * and the moment the label is baked in here, every one of those screens is
   * matching on Indonesian prose to decide what to do.
   */
  toObject() {
    return {
      ...this.pick(this.resource, ['id', 'orderNumber', 'customerName', 'customerPhone']),

      totalPrice: this.resource.totalPrice === null ? null : Number(this.resource.totalPrice),
      status: this.resource.status,
      type: this.resource.type,
      pickupDate: this.resource.pickupDate?.toISODate() ?? null,
      createdAt: this.resource.createdAt.toISO(),
    }
  }

  /**
   * The shape the staff task board reads.
   *
   * Deliberately the order number and the two fields the badge is drawn from,
   * and deliberately nothing else. A queue is a list of work that is up for
   * grabs, seen by every staff member on shift — it is not a place to publish
   * customer names, phone numbers and home addresses. Those appear once the
   * task has been claimed, attributed to the person who claimed it.
   */
  toQueue() {
    return {
      ...this.pick(this.resource, ['id', 'orderNumber']),

      status: this.resource.status,
      type: this.resource.type,
    }
  }

  /**
   * An order as it appears in a list: its own columns plus the address the
   * table shows and the charges the payment column reads.
   *
   * Both relationships are optional here. A caller that has not preloaded them
   * simply gets an order without them rather than a broken transform, which is
   * what lets the monitor and the reconciliation backlog share one variant.
   */
  toListItem() {
    return {
      ...this.toObject(),

      address: AddressTransformer.transform(this.whenLoaded(this.resource.address)),
      transactions: TransactionTransformer.transform(this.whenLoaded(this.resource.transactions)),
    }
  }

  /**
   * Everything an order detail screen needs, relationships included.
   *
   * The depth lives here rather than at each call site: how deep an order has
   * to be read to be useful is a fact about an order, not about the particular
   * controller asking for one. Lines need their item and service, and actions
   * need the staff member who recorded them — both a second level down, which
   * a nested transformer does not reach by default.
   */
  toDetail() {
    return {
      ...this.toObject(),

      user: UserTransformer.transform(this.whenLoaded(this.resource.user)),
      address: AddressTransformer.transform(this.whenLoaded(this.resource.address)),
      items: OrderItemTransformer.transform(this.whenLoaded(this.resource.items))
        ?.useVariant('toDetail')
        .depth(2),
      actions: OrderActionTransformer.transform(this.whenLoaded(this.resource.actions))
        ?.useVariant('toDetail')
        .depth(2),
      transactions: TransactionTransformer.transform(this.whenLoaded(this.resource.transactions)),
    }
  }
}
