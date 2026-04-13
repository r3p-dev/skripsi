import { OrderActionSchema } from '#database/schema'
import Tables from '#enums/table_enum'
import { belongsTo } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import Order from './order.ts'
import User from './user.ts'

export const ActionName = {
  PICKUP: 0,
  DELIVERY: 1,
  INSPECTION: 2,
  ATTEMPT_PICKUP: 3,
  ATTEMPT_DELIVERY: 4,
  ATTEMPT_INSPECTION: 5,
  RELEASE_PICKUP: 6,
  RELEASE_DELIVERY: 7,
  RELEASE_INSPECTION: 8,
} as const

export type ActionName = (typeof ActionName)[keyof typeof ActionName]

export default class OrderAction extends OrderActionSchema {
  static table = Tables.ORDER_ACTIONS

  @belongsTo(() => Order, {
    foreignKey: 'orderId',
  })
  declare order: BelongsTo<typeof Order>

  @belongsTo(() => User, {
    foreignKey: 'staffId',
  })
  declare staff: BelongsTo<typeof User>
}
