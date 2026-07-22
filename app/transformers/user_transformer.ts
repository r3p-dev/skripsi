import { type Role, RoleLabel } from '#enums/role_enum'
import type User from '#models/user'
import { BaseTransformer } from '@adonisjs/core/transformers'
import { DateTime } from 'luxon'

/**
 * Serialize user models for API responses.
 */
export default class UserTransformer extends BaseTransformer<User> {
  /**
   * Convert a user model into the public response payload.
   */
  toObject() {
    return {
      ...this.pick(this.resource, ['id', 'name', 'phone']),

      role: RoleLabel[this.resource.role as Role],
      createdAt: this.resource.createdAt.setLocale('id').toLocaleString(DateTime.DATE_FULL),
    }
  }
}
