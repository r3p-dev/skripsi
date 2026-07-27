import factory from '@adonisjs/lucid/factories'
import Address from '#models/address'

export const AddressFactory = factory
  .define(Address, async ({ faker }) => {
    return {
      name: faker.person.fullName(),
      phone: '081387882973',
      street: faker.location.streetAddress(),
      latitude: faker.location.latitude(),
      longitude: faker.location.longitude(),
      note: faker.lorem.sentence(),
      isActive: true,
    }
  })
  .state('inactive', (address) => {
    address.isActive = false
  })
  .build()
