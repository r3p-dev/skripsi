import { ShoeSchema } from '#database/schema'
import Tables from '#enums/table_enum'
import { belongsTo, hasMany } from '@adonisjs/lucid/orm'
import type { BelongsTo, HasMany } from '@adonisjs/lucid/types/relations'
import Order from './order.ts'
import OrderItem from './order_item.ts'

export default class Shoe extends ShoeSchema {
  static table = Tables.SHOES

  @belongsTo(() => Order, {
    foreignKey: 'orderId',
  })
  declare order: BelongsTo<typeof Order>

  @hasMany(() => OrderItem, {
    foreignKey: 'shoeId',
  })
  declare orderItems: HasMany<typeof OrderItem>
}
