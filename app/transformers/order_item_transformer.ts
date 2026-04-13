import type OrderItem from '#models/order_item'
import { BaseTransformer } from '@adonisjs/core/transformers'
import ServiceTransformer from './service_transformer.ts'
import ShoeTransformer from './shoe_transformer.ts'

export default class OrderItemTransformer extends BaseTransformer<OrderItem> {
  toObject() {
    return {
      ...this.pick(this.resource, ['id', 'name', 'price', 'subtotal', 'createdAt']),
      service: ServiceTransformer.transform(this.whenLoaded(this.resource.service)),
      shoe: ShoeTransformer.transform(this.whenLoaded(this.resource.shoe)),
    }
  }
}
