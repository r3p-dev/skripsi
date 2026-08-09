import { OrderItemSchema } from '#database/schema'
import { belongsTo } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import Order from '#models/order'
import Item from '#models/item'
import Catalogue from '#models/catalogue'

export default class OrderItem extends OrderItemSchema {
  @belongsTo(() => Order, {
    foreignKey: 'orderId',
  })
  declare order: BelongsTo<typeof Order>

  @belongsTo(() => Catalogue, {
    foreignKey: 'catalogueId',
  })
  declare catalogue: BelongsTo<typeof Catalogue>

  @belongsTo(() => Item, {
    foreignKey: 'itemId',
  })
  declare item: BelongsTo<typeof Item>
}
