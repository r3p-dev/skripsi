import { ItemSchema } from '#database/schema'
import { hasMany } from '@adonisjs/lucid/orm'
import type { HasMany } from '@adonisjs/lucid/types/relations'
import OrderItem from '#models/order_item'

export default class Item extends ItemSchema {
  @hasMany(() => OrderItem, {
    foreignKey: 'itemId',
  })
  declare orderItems: HasMany<typeof OrderItem>
}
