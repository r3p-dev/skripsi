import { DiscountSchema } from '#database/schema'
import Tables from '#enums/table_enum'
import { hasMany } from '@adonisjs/lucid/orm'
import type { HasMany } from '@adonisjs/lucid/types/relations'
import Order from './order.ts'

export const DiscountType = {
  PERCENTAGE: 0,
  FIXED: 1,
} as const

export type DiscountType = (typeof DiscountType)[keyof typeof DiscountType]

export default class Discount extends DiscountSchema {
  static table = Tables.DISCOUNTS

  @hasMany(() => Order, {
    foreignKey: 'discountId',
  })
  declare orders: HasMany<typeof Order>
}
