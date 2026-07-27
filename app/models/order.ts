import { OrderSchema } from '#database/schema'
import { belongsTo, hasMany } from '@adonisjs/lucid/orm'
import type { BelongsTo, HasMany } from '@adonisjs/lucid/types/relations'
import Address from '#models/address'
import OrderAction from '#models/order_action'
import OrderItem from '#models/order_item'
import Transaction from '#models/transaction'
import User from '#models/user'

export default class Order extends OrderSchema {
  @belongsTo(() => User, {
    foreignKey: 'userId',
  })
  declare user: BelongsTo<typeof User>

  @belongsTo(() => Address, {
    foreignKey: 'addressId',
  })
  declare address: BelongsTo<typeof Address>

  @hasMany(() => OrderItem, {
    foreignKey: 'orderId',
  })
  declare items: HasMany<typeof OrderItem>

  @hasMany(() => OrderAction, {
    foreignKey: 'orderId',
  })
  declare actions: HasMany<typeof OrderAction>

  @hasMany(() => Transaction, {
    foreignKey: 'orderId',
  })
  declare transactions: HasMany<typeof Transaction>
}
