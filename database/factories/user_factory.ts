import factory from '@adonisjs/lucid/factories'
import User from '#models/user'
import { Role } from '#enums/role_enum'
import { OrderFactory } from '#database/factories/order_factory'
import { AddressFactory } from '#database/factories/address_factory'

export const UserFactory = factory
  .define(User, async ({ faker }) => {
    return {
      name: faker.person.fullName(),
      phone: '081387882973',
      password: 'password123',
      role: Role.CUSTOMER,
    }
  })
  .relation('orders', () => OrderFactory)
  .relation('addresses', () => AddressFactory)
  .state('admin', (user) => {
    user.role = Role.ADMIN
  })
  .state('staff', (user) => {
    user.role = Role.STAFF
  })
  .build()
