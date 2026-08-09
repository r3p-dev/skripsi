import { ItemSchema } from '#database/schema'
import { belongsTo, hasMany } from '@adonisjs/lucid/orm'
import type { BelongsTo, HasMany } from '@adonisjs/lucid/types/relations'
import Order from '#models/order'
import OrderItem from '#models/order_item'

export default class Item extends ItemSchema {
  @belongsTo(() => Order, {
    foreignKey: 'orderId',
  })
  declare order: BelongsTo<typeof Order>

  @hasMany(() => OrderItem, {
    foreignKey: 'itemId',
  })
  declare orderItems: HasMany<typeof OrderItem>
}
