import type Notification from '#models/notification'
import UserTransformer from '#transformers/user_transformer'
import { BaseTransformer } from '@adonisjs/core/transformers'

export default class NotificationTransformer extends BaseTransformer<Notification> {
  toObject() {
    return {
      ...this.pick(this.resource, ['id', 'title', 'message', 'isRead', 'type', 'createdAt']),
      user: UserTransformer.transform(this.whenLoaded(this.resource.user)),
    }
  }
}
