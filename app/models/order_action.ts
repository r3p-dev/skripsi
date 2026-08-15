import { OrderActionSchema } from '#database/schema'
import { belongsTo } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import Order from '#models/order'
import User from '#models/user'

export default class OrderAction extends OrderActionSchema {
  @belongsTo(() => Order, {
    foreignKey: 'orderId',
  })
  declare order: BelongsTo<typeof Order>

  @belongsTo(() => User, {
    foreignKey: 'userId',
  })
  declare staff: BelongsTo<typeof User>
}
