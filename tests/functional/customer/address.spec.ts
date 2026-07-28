import { AddressFactory } from '#database/factories/address_factory'
import { UserFactory } from '#database/factories/user_factory'
import Address from '#models/address'
import testUtils from '@adonisjs/core/services/test_utils'
import { test } from '@japa/runner'

/**
 * Inside the service area: the shop's own coordinates.
 */
const INSIDE_SERVICE_AREA = { latitude: -6.9555305, longitude: 107.6540353 }

/**
 * Outside the service area: Jakarta, roughly 120 km north-west of the shop.
 */
const OUTSIDE_SERVICE_AREA = { latitude: -6.2088, longitude: 106.8456 }

function addressPayload(coordinates: { latitude: number; longitude: number }) {
  return {
    name: 'Budi Santoso',
    phone: '081211110001',
    street: 'Jalan Merdeka No 1',
    note: 'Pagar hitam',
    ...coordinates,
  }
}

test.group('Customer Address', (group) => {
  group.each.setup(() => testUtils.db().truncate())

  test('GET /address shows the customer their active address', async ({ client, assert }) => {
    const customer = await UserFactory.create()
    const address = await AddressFactory.merge({ userId: customer.id, isActive: true }).create()

    const response = await client.get('/address').withInertia().loginAs(customer)

    response.assertInertiaComponent('customer/address/show')
    assert.equal(response.inertiaProps.address.id, address.id)
  })

  test('GET /address returns no address when the customer has none', async ({ client, assert }) => {
    const customer = await UserFactory.create()

    const response = await client.get('/address').withInertia().loginAs(customer)

    assert.isNull(response.inertiaProps.address)
  })

  test('GET /address/create renders the pinpoint form', async ({ client }) => {
    const customer = await UserFactory.create()

    const response = await client.get('/address/create').withInertia().loginAs(customer)

    response.assertInertiaComponent('customer/address/create')
  })

  test('POST /address saves an address inside the service area', async ({ client, assert }) => {
    const customer = await UserFactory.create()

    const response = await client
      .post('/address')
      .loginAs(customer)
      .json(addressPayload(INSIDE_SERVICE_AREA))
      .withCsrfToken()

    response.assertRedirectsTo('/address')

    const address = await Address.query().where('user_id', customer.id).firstOrFail()
    assert.equal(address.street, 'Jalan Merdeka No 1')
    assert.isTrue(address.isActive)
  })

  test('POST /address rejects a location outside the service area', async ({ client, assert }) => {
    const customer = await UserFactory.create()

    const response = await client
      .post('/address')
      .withInertia()
      .loginAs(customer)
      .header('referer', '/address/create')
      .json(addressPayload(OUTSIDE_SERVICE_AREA))
      .withCsrfToken()

    response.assertInertiaPropsContains({
      errors: {
        radius: 'Alamat Anda tidak berada dalam area layanan. Silakan pilih lokasi lain.',
      },
    })

    assert.lengthOf(await Address.query().where('user_id', customer.id), 0)
  })

  test('POST /address keeps the previous address but deactivates it', async ({
    client,
    assert,
  }) => {
    const customer = await UserFactory.create()
    const previous = await AddressFactory.merge({ userId: customer.id, isActive: true }).create()

    await client
      .post('/address')
      .loginAs(customer)
      .json(addressPayload(INSIDE_SERVICE_AREA))
      .withCsrfToken()

    await previous.refresh()
    assert.isFalse(previous.isActive)

    const addresses = await Address.query().where('user_id', customer.id)
    assert.lengthOf(addresses, 2)
    assert.lengthOf(
      addresses.filter((address) => address.isActive),
      1
    )
  })

  test('a guest cannot reach the address pages', async ({ client }) => {
    const response = await client.get('/address').withInertia()

    response.assertRedirectsTo('/login')
  })
})
