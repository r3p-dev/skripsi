import { OrderItemSchema } from '#database/schema'
import Tables from '#enums/table_enum'
import { belongsTo } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import Order from './order.ts'
import Service from './service.ts'
import Shoe from './shoe.ts'

export default class OrderItem extends OrderItemSchema {
  static table = Tables.ORDER_ITEMS

  @belongsTo(() => Order, {
    foreignKey: 'orderId',
  })
  declare order: BelongsTo<typeof Order>

  @belongsTo(() => Service, {
    foreignKey: 'serviceId',
  })
  declare service: BelongsTo<typeof Service>

  @belongsTo(() => Shoe, {
    foreignKey: 'shoeId',
  })
  declare shoe: BelongsTo<typeof Shoe>
}
