import { test } from '@japa/runner'
import Address from '#models/address'
import testUtils from '@adonisjs/core/services/test_utils'
import { AddressFactory } from '#database/factories/address_factory'
import { UserFactory } from '#database/factories/user_factory'
import {
  AREA_CENTER,
  OUTSIDE_AREA,
  createOperationalArea,
} from '#database/factories/operational_area_factory'
import { createCustomer, createOrder, inputErrors } from '#tests/utils/helpers'

function addressForm(overrides: Record<string, string> = {}): Record<string, string> {
  return {
    name: 'Penerima Uji',
    phone: '081200000401',
    street: 'Jalan Uji Coba No. 1',
    latitude: String(AREA_CENTER.latitude),
    longitude: String(AREA_CENTER.longitude),
    ...overrides,
  }
}

test.group('Customer address | looking at it', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  test('shows the address in use', async ({ client }) => {
    const customer = await createCustomer()

    const response = await client.get('/address').loginAs(customer.user).withInertia()

    response.assertStatus(200)
    response.assertInertiaComponent('customer/address/show')
    response.assertInertiaPropsContains({
      address: { street: customer.address.street, name: customer.address.name },
    })
  })

  test('shows nothing when no address has been added', async ({ client, assert }) => {
    const user = await UserFactory.create()

    const response = await client.get('/address').loginAs(user).withInertia()

    response.assertStatus(200)
    assert.isNotOk(response.inertiaProps.address)
  })

  test('the form carries the areas the van covers', async ({ client, assert }) => {
    const area = await createOperationalArea({ name: 'Area Uji Peta' })
    const user = await UserFactory.create()

    const response = await client.get('/address/create').loginAs(user).withInertia()

    response.assertStatus(200)
    response.assertInertiaComponent('customer/address/create')

    const names = (response.inertiaProps.operationalAreas as { id: number }[]).map(
      (candidate) => candidate.id
    )

    assert.include(names, area.id)
  })

  test('a guest is sent to sign in', async ({ client }) => {
    const response = await client.get('/address').redirects(0)

    response.assertStatus(302)
    response.assertHeader('location', '/login')
  })
})

test.group('Customer address | adding one', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  test('accepts a location the van reaches', async ({ client, assert }) => {
    await createOperationalArea()

    const user = await UserFactory.create()

    const response = await client
      .post('/address')
      .loginAs(user)
      .withCsrfToken()
      .redirects(0)
      .form(addressForm())

    response.assertStatus(302)
    response.assertHeader('location', '/address')
    response.assertFlashMessage('success', 'Berhasil menambahkan alamat.')

    const address = await Address.query().where('user_id', user.id).firstOrFail()

    assert.equal(address.street, 'Jalan Uji Coba No. 1')
    assert.equal(address.name, 'Penerima Uji')
    assert.isTrue(address.isActive)
  })

  test('keeps the optional note', async ({ client, assert }) => {
    await createOperationalArea()

    const user = await UserFactory.create()

    await client
      .post('/address')
      .loginAs(user)
      .withCsrfToken()
      .redirects(0)
      .form(addressForm({ note: 'Pagar hijau, rumah kedua dari ujung' }))

    const address = await Address.query().where('user_id', user.id).firstOrFail()

    assert.equal(address.note, 'Pagar hijau, rumah kedua dari ujung')
  })

  test('turns away a location outside the service area', async ({ client, assert }) => {
    await createOperationalArea()

    const user = await UserFactory.create()

    const response = await client
      .post('/address')
      .loginAs(user)
      .withCsrfToken()
      .redirects(0)
      .form(
        addressForm({
          latitude: String(OUTSIDE_AREA.latitude),
          longitude: String(OUTSIDE_AREA.longitude),
        })
      )

    response.assertStatus(302)
    assert.property(inputErrors(response), 'location')
    assert.isEmpty(await Address.query().where('user_id', user.id))
  })

  test('refuses a phone number that is not Indonesian', async ({ client, assert }) => {
    await createOperationalArea()

    const user = await UserFactory.create()

    const response = await client
      .post('/address')
      .loginAs(user)
      .withCsrfToken()
      .redirects(0)
      .form(addressForm({ phone: '12345' }))

    response.assertStatus(302)
    assert.property(inputErrors(response), 'phone')
    assert.isEmpty(await Address.query().where('user_id', user.id))
  })

  test('refuses coordinates that are not on the globe', async ({ client, assert }) => {
    await createOperationalArea()

    const user = await UserFactory.create()

    const response = await client
      .post('/address')
      .loginAs(user)
      .withCsrfToken()
      .redirects(0)
      .form(addressForm({ latitude: '120', longitude: '400' }))

    response.assertStatus(302)
    assert.property(inputErrors(response), 'latitude')
    assert.isEmpty(await Address.query().where('user_id', user.id))
  })

  test('refuses a missing street', async ({ client, assert }) => {
    await createOperationalArea()

    const user = await UserFactory.create()
    const form = addressForm()

    delete form.street

    const response = await client
      .post('/address')
      .loginAs(user)
      .withCsrfToken()
      .redirects(0)
      .form(form)

    response.assertStatus(302)
    assert.property(inputErrors(response), 'street')
  })
})

test.group('Customer address | moving house', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  test('the old address is thrown away when no order used it', async ({ client, assert }) => {
    await createOperationalArea()

    const customer = await createCustomer()

    await client
      .post('/address')
      .loginAs(customer.user)
      .withCsrfToken()
      .redirects(0)
      .form(addressForm({ street: 'Jalan Pindahan No. 9' }))

    assert.isNull(await Address.find(customer.address.id))

    const addresses = await Address.query().where('user_id', customer.user.id)

    assert.lengthOf(addresses, 1)
    assert.equal(addresses[0].street, 'Jalan Pindahan No. 9')
  })

  test('the old address is kept but retired when an order used it', async ({ client, assert }) => {
    await createOperationalArea()

    const customer = await createCustomer()

    await createOrder(customer)

    await client
      .post('/address')
      .loginAs(customer.user)
      .withCsrfToken()
      .redirects(0)
      .form(addressForm({ street: 'Jalan Pindahan No. 9' }))

    const previous = await Address.findOrFail(customer.address.id)

    assert.isFalse(previous.isActive)

    const active = await Address.query()
      .where('user_id', customer.user.id)
      .andWhere('is_active', true)
      .firstOrFail()

    assert.equal(active.street, 'Jalan Pindahan No. 9')
  })

  test("never disturbs another customer's address", async ({ client, assert }) => {
    await createOperationalArea()

    const customer = await createCustomer()
    const stranger = await UserFactory.create()
    const strangerAddress = await AddressFactory.merge({ userId: stranger.id }).create()

    await client
      .post('/address')
      .loginAs(customer.user)
      .withCsrfToken()
      .redirects(0)
      .form(addressForm({ street: 'Jalan Pindahan No. 9' }))

    const untouched = await Address.findOrFail(strangerAddress.id)

    assert.isTrue(untouched.isActive)
    assert.equal(untouched.street, strangerAddress.street)
  })
})
