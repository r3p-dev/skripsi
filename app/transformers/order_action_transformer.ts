import type OrderAction from '#models/order_action'
import UserTransformer from '#transformers/user_transformer'
import { BaseTransformer } from '@adonisjs/core/transformers'

export default class OrderActionTransformer extends BaseTransformer<OrderAction> {
  toObject() {
    return {
      ...this.pick(this.resource, ['id', 'name', 'note', 'createdAt', 'updatedAt']),
      staff: UserTransformer.transform(this.whenLoaded(this.resource.staff)),
    }
  }
}
