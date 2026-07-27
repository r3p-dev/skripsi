import { ServiceSchema } from '#database/schema'
import { hasMany } from '@adonisjs/lucid/orm'
import type { HasMany } from '@adonisjs/lucid/types/relations'
import OrderItem from '#models/order_item'

export default class Service extends ServiceSchema {
  @hasMany(() => OrderItem, {
    foreignKey: 'serviceId',
  })
  declare orderItems: HasMany<typeof OrderItem>
}
