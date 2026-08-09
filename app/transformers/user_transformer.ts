import { type Role, RoleLabel } from '#enums/role_enum'
import type User from '#models/user'
import { BaseTransformer } from '@adonisjs/core/transformers'
import { DateTime } from 'luxon'

export default class UserTransformer extends BaseTransformer<User> {
  toObject() {
    return {
      ...this.pick(this.resource, ['id', 'name', 'phone']),

      initials: this.resource.name
        .split(' ')
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part.charAt(0).toUpperCase())
        .join(''),

      role: this.resource.role,
      roleLabel: RoleLabel[this.resource.role as Role],
      isActive: Boolean(this.resource.isActive),

      createdAt: this.resource.createdAt.setLocale('id').toLocaleString(DateTime.DATE_FULL),
    }
  }
}
