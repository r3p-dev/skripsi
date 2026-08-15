import { OrderSchema } from '#database/schema'
import { belongsTo, hasMany } from '@adonisjs/lucid/orm'
import type { BelongsTo, HasMany } from '@adonisjs/lucid/types/relations'
import Address from '#models/address'
import Item from '#models/item'
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

  @hasMany(() => Item, {
    foreignKey: 'orderId',
  })
  declare items: HasMany<typeof Item>

  @hasMany(() => OrderItem, {
    foreignKey: 'orderId',
  })
  declare orderItems: HasMany<typeof OrderItem>

  @hasMany(() => Transaction, {
    foreignKey: 'orderId',
  })
  declare transactions: HasMany<typeof Transaction>
}
