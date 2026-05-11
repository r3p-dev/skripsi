import { ShoeSchema } from '#database/schema'
import Tables from '#enums/table_enum'
import { hasMany } from '@adonisjs/lucid/orm'
import type { HasMany } from '@adonisjs/lucid/types/relations'
import OrderItem from './order_item.ts'

export default class Shoe extends ShoeSchema {
  static table = Tables.SHOES

  @hasMany(() => OrderItem, {
    foreignKey: 'shoeId',
  })
  declare orderItems: HasMany<typeof OrderItem>
}
