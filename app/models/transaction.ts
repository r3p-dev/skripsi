import { TransactionSchema } from '#database/schema'
import Tables from '#enums/table_enum'
import { belongsTo } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import Order from './order.ts'

export const TransactionType = {
  DOWN_PAYMENT: 0,
  FULL_PAYMENT: 1,
} as const

export const PaymentMethod = {
  QRIS: 0,
  CASH: 1,
} as const

export const TransactionStatus = {
  PENDING: 0,
  PAID: 1,
  EXPIRED: 2,
  CANCELLED: 3,
  FAILED: 4,
} as const

export type TransactionType = (typeof TransactionType)[keyof typeof TransactionType]
export type PaymentMethod = (typeof PaymentMethod)[keyof typeof PaymentMethod]
export type TransactionStatus = (typeof TransactionStatus)[keyof typeof TransactionStatus]

export default class Transaction extends TransactionSchema {
  static table = Tables.TRANSACTIONS

  @belongsTo(() => Order, {
    foreignKey: 'orderId',
  })
  declare order: BelongsTo<typeof Order>
}
