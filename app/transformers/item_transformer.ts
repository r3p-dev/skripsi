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

      name: [ItemTypeLabel[this.resource.type], this.resource.brand, this.resource.model]
        .filter(Boolean)
        .join(' '),

      catalogues: OrderItemTransformer.transform(this.whenLoaded(this.resource.orderItems)),

      /**
       * Condition is recorded per booked catalogue, but every line for one item
       * carries the same note — it describes the object, not the catalogue.
       */
      condition: this.resource.orderItems?.at(0)?.condition ?? '',

      subtotal: this.#subtotal(),
      subtotalLabel: formatRupiah(this.#subtotal()),
    }
  }

  #subtotal(): number {
    const catalogues = this.resource.orderItems ?? []

    return catalogues.reduce((total, catalogue) => total + Number(catalogue.subtotal), 0)
  }
}
