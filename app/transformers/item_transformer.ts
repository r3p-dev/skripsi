import { type ItemType, ItemTypeLabel } from '#enums/service_enum'
import type Item from '#models/item'
import { BaseTransformer } from '@adonisjs/core/transformers'
import { DateTime } from 'luxon'

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

      type: ItemTypeLabel[this.resource.type as ItemType],
      createdAt: this.resource.createdAt.setLocale('id').toLocaleString(DateTime.DATE_FULL),
    }
  }
}
