import type Shoe from '#models/shoe'
import { BaseTransformer } from '@adonisjs/core/transformers'

export default class ShoeTransformer extends BaseTransformer<Shoe> {
  toObject() {
    return this.pick(this.resource, [
      'id',
      'brand',
      'size',
      'type',
      'material',
      'category',
      'condition',
      'note',
      'createdAt',
    ])
  }
}
