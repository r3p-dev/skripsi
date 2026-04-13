import { UserSchema } from '#database/schema'
import Tables from '#enums/table_enum'
import { withAuthFinder } from '@adonisjs/auth/mixins/lucid'
import { DbRememberMeTokensProvider } from '@adonisjs/auth/session'
import { compose } from '@adonisjs/core/helpers'
import hash from '@adonisjs/core/services/hash'
import { hasMany } from '@adonisjs/lucid/orm'
import type { HasMany } from '@adonisjs/lucid/types/relations'
import Address from './address.ts'
import Notification from './notification.ts'
import Order from './order.ts'
import OrderAction from './order_action.ts'
import PushNotification from './push_notification.ts'
import Review from './review.ts'

export const Role = {
  CUSTOMER: 0,
  STAFF: 1,
  ADMIN: 2,
} as const

export type Role = (typeof Role)[keyof typeof Role]

const AuthFinder = withAuthFinder(hash, {
  uids: ['phone'],
  passwordColumnName: 'password',
})

export default class User extends compose(UserSchema, AuthFinder) {
  static table = Tables.USERS

  @hasMany(() => Address, {
    foreignKey: 'userId',
  })
  declare addresses: HasMany<typeof Address>

  @hasMany(() => Order, {
    foreignKey: 'userId',
  })
  declare orders: HasMany<typeof Order>

  @hasMany(() => Notification, {
    foreignKey: 'userId',
  })
  declare notifications: HasMany<typeof Notification>

  @hasMany(() => Review, {
    foreignKey: 'userId',
  })
  declare reviews: HasMany<typeof Review>

  @hasMany(() => OrderAction, {
    foreignKey: 'staffId',
  })
  declare orderActions: HasMany<typeof OrderAction>

  @hasMany(() => PushNotification, {
    foreignKey: 'userId',
  })
  declare pushNotifications: HasMany<typeof PushNotification>

  static rememberMeTokens = DbRememberMeTokensProvider.forModel(User)
}
