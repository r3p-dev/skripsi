import { BaseTransformer } from '@adonisjs/core/transformers'
import type OrderAction from '#models/order_action'
import { DateTime } from 'luxon'
import UserTransformer from '#transformers/user_transformer'
import OrderTransformer from '#transformers/order_transformer'
import { type ActionName, ActionNameLabel } from '#enums/order_action_enum'

/**
 * Serialize order action history records for API responses.
 */
export default class OrderActionTransformer extends BaseTransformer<OrderAction> {
  /**
   * Convert an order action model into the public response payload.
   */
  toObject() {
    return {
      ...this.pick(this.resource, ['id', 'photoPath', 'note']),

      name: ActionNameLabel[this.resource.name as ActionName],
      createdAt: this.resource.createdAt.setLocale('id').toLocaleString(DateTime.DATE_FULL),

      staff: UserTransformer.transform(this.whenLoaded(this.resource.staff)),
      order: OrderTransformer.transform(this.whenLoaded(this.resource.order)),
    }
  }
}
