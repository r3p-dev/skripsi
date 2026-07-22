import { AddressSchema } from '#database/schema'
import { belongsTo, hasMany } from '@adonisjs/lucid/orm'
import type { BelongsTo, HasMany } from '@adonisjs/lucid/types/relations'
import Order from '#models/order'
import User from '#models/user'

export default class Address extends AddressSchema {
  @belongsTo(() => User, {
    foreignKey: 'userId',
  })
  declare user: BelongsTo<typeof User>

  @hasMany(() => Order, {
    foreignKey: 'addressId',
  })
  declare orders: HasMany<typeof Order>
}
