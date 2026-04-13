import { ServiceSchema } from '#database/schema'
import Tables from '#enums/table_enum'
import { hasMany } from '@adonisjs/lucid/orm'
import type { HasMany } from '@adonisjs/lucid/types/relations'
import OrderItem from './order_item.ts'

export const ServiceType = {
  BASE: 0,
  START_FROM: 1,
  ADDON: 2,
} as const

export type ServiceType = (typeof ServiceType)[keyof typeof ServiceType]

export default class Service extends ServiceSchema {
  static table = Tables.SERVICES

  @hasMany(() => OrderItem, {
    foreignKey: 'serviceId',
  })
  declare orderItems: HasMany<typeof OrderItem>
}
