import { OrderSchema } from '#database/schema'
import Tables from '#enums/table_enum'
import { beforeCreate, belongsTo, hasMany, hasOne } from '@adonisjs/lucid/orm'
import type { BelongsTo, HasMany, HasOne } from '@adonisjs/lucid/types/relations'
import Address from './address.ts'
import Discount from './discount.ts'
import OrderAction from './order_action.ts'
import OrderItem from './order_item.ts'
import Review from './review.ts'
import Shoe from './shoe.ts'
import Transaction from './transaction.ts'
import User from './user.ts'

export const OrderType = {
  PICKUP_DELIVERY: 0,
  DROP_OFF: 1,
  DROP_OFF_DELIVERY: 2,
} as const

export const OrderStatus = {
  AWAITING_DEPOSIT: 1,
  IN_PICKUP: 2,
  IN_INSPECTION: 3,
  AWAITING_FULL_PAYMENT: 4,
  IN_CLEANING: 5,
  IN_DELIVERY: 6,
  COMPLETED: 7,
  CANCELLED: 8,
} as const

export const PaymentStatus = {
  UNPAID: 0,
  PARTIALLY_PAID: 1,
  PAID: 2,
} as const

export type OrderType = (typeof OrderType)[keyof typeof OrderType]
export type OrderStatus = (typeof OrderStatus)[keyof typeof OrderStatus]
export type PaymentStatus = (typeof PaymentStatus)[keyof typeof PaymentStatus]

export default class Order extends OrderSchema {
  static table = Tables.ORDERS

  @belongsTo(() => User, {
    foreignKey: 'userId',
  })
  declare user: BelongsTo<typeof User>

  @belongsTo(() => Address, {
    foreignKey: 'addressId',
  })
  declare address: BelongsTo<typeof Address>

  @belongsTo(() => Discount, {
    foreignKey: 'discountId',
  })
  declare discount: BelongsTo<typeof Discount>

  @hasMany(() => OrderItem, {
    foreignKey: 'orderId',
  })
  declare items: HasMany<typeof OrderItem>

  @hasMany(() => OrderAction, {
    foreignKey: 'orderId',
  })
  declare actions: HasMany<typeof OrderAction>

  @hasOne(() => Review, {
    foreignKey: 'orderId',
  })
  declare review: HasOne<typeof Review>

  @hasMany(() => Shoe, {
    foreignKey: 'orderId',
  })
  declare shoes: HasMany<typeof Shoe>

  @hasMany(() => Transaction, {
    foreignKey: 'orderId',
  })
  declare transactions: HasMany<typeof Transaction>

  @beforeCreate()
  static async generateNumber(order: Order) {
    order.number = await this.generateOrderNumber()
  }

  private static async generateOrderNumber() {
    const { day, year, month } = this.getCurrentYearMonth()
    const prefix = `ORD${year}${month}${day}`
    const lastOrder = await this.getLastOrderForDay(prefix)
    const nextIncrement = this.calculateNextIncrement(lastOrder)
    const identifier = this.formatIdentifier(nextIncrement)

    return `${prefix}-${identifier}`
  }

  private static getCurrentYearMonth() {
    const today = new Date()
    const day = today.getDate().toString().padStart(2, '0')
    const year = today.getFullYear().toString().slice(-2)
    const month = (today.getMonth() + 1).toString().padStart(2, '0')

    return { year, month, day }
  }

  private static async getLastOrderForDay(prefix: string) {
    return await Order.query()
      .where('number', 'like', `${prefix}-%`)
      .orderBy('number', 'desc')
      .first()
  }

  private static calculateNextIncrement(lastOrder: Order | null) {
    if (!lastOrder) return 1

    const lastNumber = lastOrder.number.split('-')[1]
    return Number.parseInt(lastNumber) + 1
  }

  private static formatIdentifier(increment: number) {
    return increment.toString().padStart(3, '0')
  }
}
