import type Item from '#models/item'
import { ItemTypeLabel } from '#enums/item_enum'
import { BaseTransformer } from '@adonisjs/core/transformers'
import OrderItemTransformer from '#transformers/order_item_transformer'
import { formatRupiah } from '#utils/currency'

export default class ItemTransformer extends BaseTransformer<Item> {
  toObject() {
    return {
      ...this.pick(this.resource, ['id', 'brand', 'model', 'material', 'size', 'note']),

      type: this.resource.type,
      typeLabel: ItemTypeLabel[this.resource.type],

      services: OrderItemTransformer.transform(this.whenLoaded(this.resource.orderItems)),

      subtotal: this.#subtotal(),
      subtotalLabel: formatRupiah(this.#subtotal()),
    }
  }

  #subtotal(): number {
    const services = this.resource.orderItems ?? []

    return services.reduce((total, service) => total + Number(service.subtotal), 0)
  }
}
