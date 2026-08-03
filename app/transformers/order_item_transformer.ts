import type OrderItem from '#models/order_item'
import { BaseTransformer } from '@adonisjs/core/transformers'
import ServiceTransformer from '#transformers/service_transformer'
import ItemTransformer from '#transformers/item_transformer'
import { DateTime } from 'luxon'

export default class OrderItemTransformer extends BaseTransformer<OrderItem> {
  /**
   * A priced line on an order, on its own.
   */
  toObject() {
    return {
      ...this.pick(this.resource, ['id', 'name']),

      price: Number(this.resource.price),
      subtotal: Number(this.resource.subtotal),
      createdAt: this.resource.createdAt.toLocaleString(DateTime.DATE_FULL),
    }
  }

  /**
   * The line together with the thing being cleaned and the service picked for
   * it, which is what the inspection correction form and the order detail view
   * both read.
   */
  toDetail() {
    return {
      ...this.toObject(),

      service: ServiceTransformer.transform(this.whenLoaded(this.resource.service)),
      item: ItemTransformer.transform(this.whenLoaded(this.resource.item)),
    }
  }
}
