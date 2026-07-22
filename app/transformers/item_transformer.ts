import type Shoe from '#models/item'
import { BaseTransformer } from '@adonisjs/core/transformers'
import { DateTime } from 'luxon'
import { type ItemType, ItemTypeLabel } from '#enums/item_type_enum'

/**
 * Serialize shoe models for API responses.
 */
export default class ShoeTransformer extends BaseTransformer<Shoe> {
  /**
   * Convert a shoe model into the public response payload.
   */
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
