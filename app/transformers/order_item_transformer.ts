import { BaseTransformer } from '@adonisjs/core/transformers'
import type OrderItem from '#models/order_item'
import { DateTime } from 'luxon'
import ServiceTransformer from '#transformers/service_transformer'
import ShoeTransformer from '#transformers/item_transformer'
import OrderTransformer from '#transformers/order_transformer'
import { formatRupiah } from '#utils/currency'

/**
 * Serialize order item models for API responses.
 */
export default class OrderItemTransformer extends BaseTransformer<OrderItem> {
  /**
   * Convert an order item model into the public response payload.
   */
  toObject() {
    return {
      ...this.pick(this.resource, ['id', 'name']),

      price: formatRupiah(this.resource.price),
      subtotal: formatRupiah(this.resource.subtotal),
      createdAt: this.resource.createdAt.setLocale('id').toLocaleString(DateTime.DATE_FULL),

      service: ServiceTransformer.transform(this.whenLoaded(this.resource.service)),
      item: ShoeTransformer.transform(this.whenLoaded(this.resource.item)),
      order: OrderTransformer.transform(this.whenLoaded(this.resource.order)),
    }
  }
}
