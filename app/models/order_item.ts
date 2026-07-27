import { OrderItemSchema } from '#database/schema'
import { belongsTo } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import Order from '#models/order'
import Service from '#models/service'
import Item from '#models/item'

export default class OrderItem extends OrderItemSchema {
  @belongsTo(() => Order, {
    foreignKey: 'orderId',
  })
  declare order: BelongsTo<typeof Order>

  @belongsTo(() => Service, {
    foreignKey: 'serviceId',
  })
  declare service: BelongsTo<typeof Service>

  @belongsTo(() => Item, {
    foreignKey: 'itemId',
  })
  declare item: BelongsTo<typeof Item>
}
