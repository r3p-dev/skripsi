import type Order from '#models/order'
import AddressTransformer from '#transformers/address_transformer'
import ItemTransformer from '#transformers/item_transformer'
import OrderActionTransformer from '#transformers/order_action_transformer'
import TransactionTransformer from '#transformers/transaction_transformer'
import UserTransformer from '#transformers/user_transformer'
import { OrderStatus, OrderStatusLabel, OrderTypeLabel } from '#enums/order_enum'
import { BaseTransformer } from '@adonisjs/core/transformers'
import { formatRupiah } from '#utils/currency'
import { formatDate, formatShortDate } from '#utils/date'

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

      pickupDate: formatDate(this.resource.pickupDate),
      createdAt: formatDate(this.resource.createdAt),
    }
  }

  toQueue() {
    return {
      ...this.pick(this.resource, ['id', 'orderNumber']),

      status: this.resource.status,
      statusLabel: OrderStatusLabel[this.resource.status],

      type: this.resource.type,
      typeLabel: OrderTypeLabel[this.resource.type],

      pickupDate: formatDate(this.resource.pickupDate),
    }
  }

  toListItem() {
    return {
      ...this.pick(this.resource, ['id', 'orderNumber', 'customerName', 'customerPhone']),

      status: this.resource.status,
      statusLabel: OrderStatusLabel[this.resource.status],

      type: this.resource.type,
      typeLabel: OrderTypeLabel[this.resource.type],

      totalPrice: this.resource.totalPrice === null ? null : Number(this.resource.totalPrice),
      totalPriceLabel:
        this.resource.totalPrice === null ? null : formatRupiah(this.resource.totalPrice),

      createdAt: this.resource.createdAt.toISO(),
      createdAtLabel: formatShortDate(this.resource.createdAt),

      pickupDate: this.resource.pickupDate?.toISODate() ?? null,
      pickupDateLabel: formatShortDate(this.resource.pickupDate),

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
