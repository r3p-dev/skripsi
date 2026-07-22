import { BaseTransformer } from '@adonisjs/core/transformers'
import type Notification from '#models/notification'
import { DateTime } from 'luxon'
import UserTransformer from '#transformers/user_transformer'

/**
 * Serialize notification models for API responses.
 */
export default class NotificationTransformer extends BaseTransformer<Notification> {
  /**
   * Convert a notification model into the public response payload.
   */
  toObject() {
    return {
      ...this.pick(this.resource, ['id', 'title', 'message']),

      createdAt: this.resource.createdAt.setLocale('id').toLocaleString(DateTime.DATE_FULL),

      user: UserTransformer.transform(this.whenLoaded(this.resource.user)),
    }
  }
}
