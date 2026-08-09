import { hasMany } from '@adonisjs/lucid/orm'
import type { HasMany } from '@adonisjs/lucid/types/relations'
import OrderItem from '#models/order_item'
import { CatalogueSchema } from '#database/schema'

export default class Catalogue extends CatalogueSchema {
  @hasMany(() => OrderItem, {
    foreignKey: 'catalogueId',
  })
  declare orderItems: HasMany<typeof OrderItem>
}
