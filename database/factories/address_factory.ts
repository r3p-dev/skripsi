import Address from '#models/address'
import factory from '@adonisjs/lucid/factories'
import { AREA_CENTER } from '#database/factories/operational_area_factory'
import { OrderFactory } from '#database/factories/order_factory'
import { UserFactory } from '#database/factories/user_factory'
import { nextSequence, personName, uniquePhone } from '#database/factories/support'

export const AddressFactory = factory
  .define(Address, ({ faker }) => ({
    name: personName(faker),
    phone: uniquePhone(),
    street: `Jalan Uji Coba No. ${nextSequence()}`,
    latitude: AREA_CENTER.latitude.toString(),
    longitude: AREA_CENTER.longitude.toString(),
    isActive: true,
    note: null,
  }))
  .state('inactive', (address) => {
    address.isActive = false
  })
  .relation('user', () => UserFactory)
  .relation('orders', () => OrderFactory)
  .build()
