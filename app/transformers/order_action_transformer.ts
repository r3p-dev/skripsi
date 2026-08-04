import type OrderAction from '#models/order_action'
import { BaseTransformer } from '@adonisjs/core/transformers'
import UserTransformer from '#transformers/user_transformer'
import { DateTime } from 'luxon'

export default class OrderActionTransformer extends BaseTransformer<OrderAction> {
  /**
   * One entry in an order's audit trail.
   *
   * `name` is the stored action name rather than its Indonesian caption. The
   * timeline matches on it to work out which photo is the "before" and which
   * the "after", and that match has to survive somebody rewording the caption.
   */
  toObject() {
    return {
      ...this.pick(this.resource, ['id', 'photoPath', 'note']),

      name: this.resource.name,
      createdAt: this.resource.createdAt.toLocaleString(DateTime.DATE_FULL),
    }
  }

  /**
   * The entry together with the staff member it is attributed to, which is
   * most of the point of keeping one.
   */
  toDetail() {
    return {
      ...this.toObject(),

      staff: UserTransformer.transform(this.whenLoaded(this.resource.staff)),
    }
  }
}
