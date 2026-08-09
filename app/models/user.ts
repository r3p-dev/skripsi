import { UserSchema } from '#database/schema'
import { withAuthFinder } from '@adonisjs/auth/mixins/lucid'
import { DbRememberMeTokensProvider } from '@adonisjs/auth/session'
import { compose } from '@adonisjs/core/helpers'
import hash from '@adonisjs/core/services/hash'
import { hasMany } from '@adonisjs/lucid/orm'
import type { HasMany } from '@adonisjs/lucid/types/relations'
import Address from '#models/address'
import Order from '#models/order'

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

  static rememberMeTokens = DbRememberMeTokensProvider.forModel(User)
}
