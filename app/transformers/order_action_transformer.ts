import type OrderAction from '#models/order_action'
import UserTransformer from '#transformers/user_transformer'
import { ActionNameLabel } from '#enums/order_action_enum'
import { BaseTransformer } from '@adonisjs/core/transformers'
import router from '@adonisjs/core/services/router'
import { formatDateTime } from '#utils/date'

export default class OrderActionTransformer extends BaseTransformer<OrderAction> {
  toObject() {
    return {
      ...this.pick(this.resource, ['id', 'note']),

      name: this.resource.name,
      nameLabel: ActionNameLabel[this.resource.name],

      photoPath: this.resource.photoPath
        ? router.makeUrl('internal.action.photo', { id: this.resource.id })
        : null,

      staff: UserTransformer.transform(this.whenLoaded(this.resource.staff)),

      createdAt: formatDateTime(this.resource.createdAt),
    }
  }
}
