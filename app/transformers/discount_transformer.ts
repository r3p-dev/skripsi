import type Discount from '#models/discount'
import { BaseTransformer } from '@adonisjs/core/transformers'

export default class DiscountTransformer extends BaseTransformer<Discount> {
  toObject() {
    return this.pick(this.resource, [
      'id',
      'code',
      'type',
      'amount',
      'minTotalPrice',
      'maxDiscount',
      'isActive',
      'expiredAt',
      'createdAt',
    ])
  }
}
