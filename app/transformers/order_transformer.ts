import type Order from '#models/order'
import AddressTransformer from '#transformers/address_transformer'
import ItemTransformer from '#transformers/item_transformer'
import OrderActionTransformer from '#transformers/order_action_transformer'
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

  toDetail() {
    return {
      ...this.toObject(),

      address: AddressTransformer.transform(this.whenLoaded(this.resource.address)),
      items: ItemTransformer.transform(this.whenLoaded(this.resource.items))?.depth(2),
      actions: OrderActionTransformer.transform(this.whenLoaded(this.resource.actions))?.depth(2),
    }
  }
}
