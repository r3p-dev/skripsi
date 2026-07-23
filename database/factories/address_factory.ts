import factory from '@adonisjs/lucid/factories'
import Address from '#models/address'

export const AddressFactory = factory
  .define(Address, async ({ faker }) => {
    return {
      recipientName: faker.person.fullName(),
      recipientPhone: `08${faker.string.numeric(10)}`,
      addressDetail: faker.location.streetAddress(),
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
