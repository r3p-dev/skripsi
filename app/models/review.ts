import { ReviewSchema } from '#database/schema'
import Tables from '#enums/table_enum'
import { belongsTo } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import Order from './order.ts'
import User from './user.ts'

export default class Review extends ReviewSchema {
  static table = Tables.REVIEWS

  @belongsTo(() => Order, {
    foreignKey: 'orderId',
  })
  declare order: BelongsTo<typeof Order>

  @belongsTo(() => User, {
    foreignKey: 'userId',
  })
  declare user: BelongsTo<typeof User>
}
