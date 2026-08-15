import User from '#models/user'
import factory from '@adonisjs/lucid/factories'
import { AddressFactory } from '#database/factories/address_factory'
import { OrderFactory } from '#database/factories/order_factory'
import { Role } from '#enums/role_enum'
import { personName, uniquePhone } from '#database/factories/support'

export const USER_PASSWORD = 'rahasia123'

export const UserFactory = factory
  .define(User, ({ faker }) => ({
    name: personName(faker),
    phone: uniquePhone(),
    password: USER_PASSWORD,
    role: Role.CUSTOMER,
    isActive: true,
  }))
  .state('staff', (user) => {
    user.role = Role.STAFF
  })
  .state('admin', (user) => {
    user.role = Role.ADMIN
  })
  .state('inactive', (user) => {
    user.isActive = false
  })
  .relation('addresses', () => AddressFactory)
  .relation('orders', () => OrderFactory)
  .build()
