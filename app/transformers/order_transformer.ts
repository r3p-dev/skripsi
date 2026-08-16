import type Order from '#models/order'
import AddressTransformer from '#transformers/address_transformer'
import ItemTransformer from '#transformers/item_transformer'
import OrderActionTransformer from '#transformers/order_action_transformer'
import TransactionTransformer from '#transformers/transaction_transformer'
import UserTransformer from '#transformers/user_transformer'
import { OrderStatus, OrderStatusLabel, OrderTypeLabel } from '#enums/order_enum'
import { BaseTransformer } from '@adonisjs/core/transformers'
import { DateTime } from 'luxon'
import { formatRupiah } from '#utils/currency'

export default class OrderTransformer extends BaseTransformer<Order> {
  toObject() {
    return {
      ...this.pick(this.resource, ['id', 'orderNumber', 'customerName', 'customerPhone']),

      status: this.resource.status,
      statusLabel: OrderStatusLabel[this.resource.status],
      isCompleted: this.resource.status === OrderStatus.COMPLETED,

      type: this.resource.type,
      typeLabel: OrderTypeLabel[this.resource.type],

      totalPrice: Number(this.resource.totalPrice ?? 0),
      totalPriceLabel: formatRupiah(this.resource.totalPrice),

      pickupDate:
        this.resource.pickupDate?.setLocale('id').toLocaleString(DateTime.DATE_FULL) ?? null,
      createdAt: this.resource.createdAt.setLocale('id').toLocaleString(DateTime.DATE_FULL),
    }
  }

  toQueue() {
    return {
      ...this.pick(this.resource, ['id', 'orderNumber']),

      status: this.resource.status,
      statusLabel: OrderStatusLabel[this.resource.status],

      type: this.resource.type,
      typeLabel: OrderTypeLabel[this.resource.type],

      pickupDate:
        this.resource.pickupDate?.setLocale('id').toLocaleString(DateTime.DATE_FULL) ?? null,
    }
  }

  /**
   * A row in an admin list. Dates stay machine-readable here because the table
   * formats them itself, unlike the detail views that print what they are given.
   */
  toListItem() {
    return {
      ...this.pick(this.resource, ['id', 'orderNumber', 'customerName', 'customerPhone']),

      status: this.resource.status,
      statusLabel: OrderStatusLabel[this.resource.status],

      type: this.resource.type,
      typeLabel: OrderTypeLabel[this.resource.type],

      totalPrice: this.resource.totalPrice === null ? null : Number(this.resource.totalPrice),

      createdAt: this.resource.createdAt.toISO(),
      pickupDate: this.resource.pickupDate?.toISODate() ?? null,

      transactions: TransactionTransformer.transform(this.whenLoaded(this.resource.transactions)),
    }
  }

  toDetail() {
    return {
      ...this.toObject(),

      address: AddressTransformer.transform(this.whenLoaded(this.resource.address)),
      items: ItemTransformer.transform(this.whenLoaded(this.resource.items))?.depth(2),
      actions: OrderActionTransformer.transform(this.whenLoaded(this.resource.actions))?.depth(2),
      transactions: TransactionTransformer.transform(this.whenLoaded(this.resource.transactions)),
      user: UserTransformer.transform(this.whenLoaded(this.resource.user)),
    }
  }
}
