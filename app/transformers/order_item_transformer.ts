import type OrderItem from '#models/order_item'
import { BaseTransformer } from '@adonisjs/core/transformers'
import { formatRupiah } from '#utils/currency'
import { DateTime } from 'luxon'
import ServiceTransformer from '#transformers/service_transformer'
import OrderTransformer from '#transformers/order_transformer'
import ItemTransformer from '#transformers/item_transformer'

export default class OrderItemTransformer extends BaseTransformer<OrderItem> {
  toObject() {
    return {
      ...this.pick(this.resource, ['id', 'name']),

      price: formatRupiah(this.resource.price),
      subtotal: formatRupiah(this.resource.subtotal),
      createdAt: this.resource.createdAt.setLocale('id').toLocaleString(DateTime.DATE_FULL),

      service: ServiceTransformer.transform(this.whenLoaded(this.resource.service)),
      item: ItemTransformer.transform(this.whenLoaded(this.resource.item)),
      order: OrderTransformer.transform(this.whenLoaded(this.resource.order)),
    }
  }
}
