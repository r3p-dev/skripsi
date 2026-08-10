import type OrderItem from '#models/order_item'
import { BaseTransformer } from '@adonisjs/core/transformers'
import { formatRupiah } from '#utils/currency'

export default class OrderItemTransformer extends BaseTransformer<OrderItem> {
  toObject() {
    return {
      ...this.pick(this.resource, ['id', 'name', 'itemId']),

      price: Number(this.resource.price),
      priceLabel: formatRupiah(this.resource.price),

      subtotal: Number(this.resource.subtotal),
      subtotalLabel: formatRupiah(this.resource.subtotal),
    }
  }
}
