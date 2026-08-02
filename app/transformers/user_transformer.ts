import type User from '#models/user'
import { BaseTransformer } from '@adonisjs/core/transformers'

export default class UserTransformer extends BaseTransformer<User> {
  /**
   * An account's own columns.
   *
   * `role` is the stored enum value, not the Indonesian word for it. A label
   * is something the interface prints; sending one over the wire means every
   * page that keys a badge, a filter or a permission check off the field is
   * matching on prose, and breaks the day somebody rewords it.
   */
  toObject() {
    return {
      ...this.pick(this.resource, ['id', 'name', 'phone']),

      role: this.resource.role,
      isActive: Boolean(this.resource.isActive),
      createdAt: this.resource.createdAt.toISO(),
    }
  }
}
