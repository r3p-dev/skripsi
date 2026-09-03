import { test } from '@japa/runner'
import Address from '#models/address'
import AddressService from '#services/address_service'
import testUtils from '@adonisjs/core/services/test_utils'
import { AddressFactory } from '#database/factories/address_factory'
import { UserFactory } from '#database/factories/user_factory'
import {
  AREA_CENTER,
  OUTSIDE_AREA,
  createOperationalArea,
} from '#database/factories/operational_area_factory'
import { createCustomer, createOrder, validationMessages } from '#tests/utils/helpers'

const addressService = new AddressService()

function addressPayload(overrides: Record<string, unknown> = {}) {
  return {
    name: 'Penerima Uji',
    phone: '081200000999',
    street: 'Jalan Uji Coba No. 1',
    latitude: AREA_CENTER.latitude,
    longitude: AREA_CENTER.longitude,
    note: undefined,
    ...overrides,
  }
}

test.group('AddressService | the active address', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  test('finds the address a customer currently uses', async ({ assert }) => {
    const { user, address } = await createCustomer()

    const active = await addressService.getActiveAddress(user)

    assert.equal(active?.id, address.id)
  })

  test('ignores addresses the customer has moved away from', async ({ assert }) => {
    const user = await UserFactory.create()

    await AddressFactory.merge({ userId: user.id }).apply('inactive').create()

    assert.isNull(await addressService.getActiveAddress(user))
  })

  test("never returns another customer's address", async ({ assert }) => {
    await createCustomer()

    const stranger = await UserFactory.create()

    assert.isNull(await addressService.getActiveAddress(stranger))
  })
})

test.group('AddressService | changing address', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  test('accepts a location inside the service area', async ({ assert }) => {
    await createOperationalArea()

    const user = await UserFactory.create()

    const address = await addressService.replaceActiveAddress(user, addressPayload())

    assert.equal(address.userId, user.id)
    assert.isTrue(address.isActive)
    assert.equal(Number(address.latitude), AREA_CENTER.latitude)
    assert.equal(Number(address.longitude), AREA_CENTER.longitude)
  })

  test('turns away a location the van does not reach', async ({ assert }) => {
    await createOperationalArea()

    const user = await UserFactory.create()

    const [failure] = await validationMessages(() =>
      addressService.replaceActiveAddress(
        user,
        addressPayload({ latitude: OUTSIDE_AREA.latitude, longitude: OUTSIDE_AREA.longitude })
      )
    )

    assert.equal(failure.field, 'location')
    assert.match(failure.message, /di luar jangkauan/i)
    assert.isNull(await addressService.getActiveAddress(user))
  })

  test('ignores areas that have been switched off', async ({ assert }) => {
    await createOperationalArea({ center: { latitude: -2.5, longitude: 118.5 }, isActive: false })

    const user = await UserFactory.create()

    const [failure] = await validationMessages(() =>
      addressService.replaceActiveAddress(
        user,
        addressPayload({ latitude: -2.5, longitude: 118.5 })
      )
    )

    assert.equal(failure.field, 'location')
  })

  test('an unused old address is thrown away', async ({ assert }) => {
    await createOperationalArea()

    const { user, address } = await createCustomer()

    await addressService.replaceActiveAddress(user, addressPayload({ street: 'Jalan Baru No. 2' }))

    assert.isNull(await Address.find(address.id))

    const active = await addressService.getActiveAddress(user)

    assert.equal(active?.street, 'Jalan Baru No. 2')
  })

  test('an old address attached to an order is kept but retired', async ({ assert }) => {
    await createOperationalArea()

    const customer = await createCustomer()

    await createOrder(customer)
    await addressService.replaceActiveAddress(
      customer.user,
      addressPayload({ street: 'Jalan Baru No. 3' })
    )

    const previous = await Address.findOrFail(customer.address.id)

    assert.isFalse(previous.isActive)

    const active = await addressService.getActiveAddress(customer.user)

    assert.equal(active?.street, 'Jalan Baru No. 3')
    assert.notEqual(active?.id, previous.id)
  })
})

test.group('AddressService | the service area', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  test('reports a bounding box that covers its areas', async ({ assert }) => {
    await createOperationalArea()

    const bounds = await addressService.getOperationalAreaBounds()

    assert.isNotNull(bounds)
    assert.isBelow(bounds!.minLatitude, AREA_CENTER.latitude)
    assert.isAbove(bounds!.maxLatitude, AREA_CENTER.latitude)
    assert.isBelow(bounds!.minLongitude, AREA_CENTER.longitude)
    assert.isAbove(bounds!.maxLongitude, AREA_CENTER.longitude)
  })

  test('lists active areas with their polygons attached', async ({ assert }) => {
    const created = await createOperationalArea({ name: 'Area Uji Polygon' })

    const areas = await addressService.getOperationalAreas()
    const area = areas.find((candidate) => candidate.id === created.id)

    assert.isDefined(area)
    assert.equal(area!.geometry?.type, 'Polygon')
    assert.deepEqual(area!.geometry?.coordinates, created.geometry.coordinates)
  })

  test('keeps only the candidates that fall inside an area', async ({ assert }) => {
    await createOperationalArea()

    const inside = await addressService.filterWithinOperationalArea([
      { ...AREA_CENTER, label: 'Dalam jangkauan' },
      { ...OUTSIDE_AREA, label: 'Luar jangkauan' },
    ])

    assert.deepEqual(
      inside.map((candidate) => candidate.label),
      ['Dalam jangkauan']
    )
  })
})

test.group('AddressService | housekeeping', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  test('sweeps away retired addresses no order points at', async ({ assert }) => {
    const user = await UserFactory.create()
    const orphan = await AddressFactory.merge({ userId: user.id }).apply('inactive').create()

    const deleted = await addressService.deleteOrphanedAddresses()

    assert.isAtLeast(deleted, 1)
    assert.isNull(await Address.find(orphan.id))
  })

  test('leaves retired addresses an order still points at', async ({ assert }) => {
    const customer = await createCustomer()

    await createOrder(customer)
    await customer.address.merge({ isActive: false }).save()

    await addressService.deleteOrphanedAddresses()

    assert.isNotNull(await Address.find(customer.address.id))
  })

  test('leaves the address a customer is still using', async ({ assert }) => {
    const { address } = await createCustomer()

    await addressService.deleteOrphanedAddresses()

    assert.isNotNull(await Address.find(address.id))
  })
})
