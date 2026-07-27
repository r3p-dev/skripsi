import { UserSchema } from '#database/schema'
import { withAuthFinder } from '@adonisjs/auth/mixins/lucid'
import { DbRememberMeTokensProvider } from '@adonisjs/auth/session'
import { compose } from '@adonisjs/core/helpers'
import hash from '@adonisjs/core/services/hash'
import { hasMany } from '@adonisjs/lucid/orm'
import type { HasMany } from '@adonisjs/lucid/types/relations'
import Address from '#models/address'
import Notification from '#models/notification'
import Order from '#models/order'
import OrderAction from '#models/order_action'

const AuthFinder = withAuthFinder(hash, {
  uids: ['phone'],
  passwordColumnName: 'password',
})

export default class User extends compose(UserSchema, AuthFinder) {
  @hasMany(() => Address, {
    foreignKey: 'userId',
  })
  declare addresses: HasMany<typeof Address>

  @hasMany(() => Order, {
    foreignKey: 'userId',
  })
  declare orders: HasMany<typeof Order>

  @hasMany(() => OrderAction, {
    foreignKey: 'staffId',
  })
  declare actions: HasMany<typeof OrderAction>

  @hasMany(() => Notification, {
    foreignKey: 'userId',
  })
  declare notifications: HasMany<typeof Notification>

  static rememberMeTokens = DbRememberMeTokensProvider.forModel(User)
}
