import type Item from '#models/item'
import { BaseTransformer } from '@adonisjs/core/transformers'

export default class ItemTransformer extends BaseTransformer<Item> {
  toObject() {
    return {
      ...this.pick(this.resource, [
        'id',
        'brand',
        'model',
        'material',
        'condition',
        'note',
        'size',
      ]),

      type: this.resource.type,
      createdAt: this.resource.createdAt.toISO(),
    }
  }
}
