import { test } from '@japa/runner'
import Order from '#models/order'
import testUtils from '@adonisjs/core/services/test_utils'
import { CatalogueFactory } from '#database/factories/catalogue_factory'
import { ItemType } from '#enums/item_enum'
import { OrderStatus, OrderType } from '#enums/order_enum'
import { PaymentMethod } from '#enums/transaction_enum'
import { UserFactory } from '#database/factories/user_factory'
import {
  PNG_PIXEL,
  createCustomer,
  createOrder,
  inputErrors,
  itemFields,
  itemPayload,
} from '#tests/utils/helpers'
import { formatRupiah } from '#utils/currency'

function staff() {
  return UserFactory.apply('staff').create()
}

function counterFields(catalogueId: number, overrides: Record<string, string> = {}) {
  return {
    name: 'Budi Santoso',
    phone: '081234567890',
    paymentMethod: PaymentMethod.CASH,
    cashReceived: '500000',
    ...itemFields([
      itemPayload({
        type: ItemType.SHOE,
        condition: 'Kotor ringan',
        catalogue: String(catalogueId),
      }),
    ]),
    ...overrides,
  }
}

test.group('Staff counter orders | the form', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  test('a staff member can open the counter form', async ({ client }) => {
    const response = await client
      .get('/staff/orders/create')
      .loginAs(await staff())
      .withInertia()

    response.assertStatus(200)
    response.assertInertiaComponent('staff/order/create')
  })

  test('a customer cannot open it', async ({ client }) => {
    const customer = await UserFactory.create()

    const response = await client.get('/staff/orders/create').loginAs(customer).redirects(0)

    response.assertStatus(302)
    response.assertHeader('location', '/profile')
  })

  test('the customer lookup answers with matching accounts', async ({ client, assert }) => {
    const customer = await UserFactory.merge({ name: 'Budi Santoso' }).create()

    const response = await client
      .get('/staff/customers')
      .qs({ search: 'Budi' })
      .loginAs(await staff())

    response.assertStatus(200)

    const body = response.body() as { customers: { id: number }[] }
    assert.include(
      body.customers.map((entry) => entry.id),
      customer.id
    )
  })
})

test.group('Staff counter orders | taking the order', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  test('an offline order is created and sent to the receipt', async ({ client, assert }) => {
    const catalogue = await CatalogueFactory.merge({ price: '75000' }).create()

    const response = await client
      .post('/staff/orders')
      .loginAs(await staff())
      .withCsrfToken()
      .file('photo', PNG_PIXEL, { filename: 'bukti.png' })
      .fields(counterFields(catalogue.id))
      .redirects(0)

    response.assertStatus(302)

    const order = await Order.query().orderBy('id', 'desc').firstOrFail()

    assert.equal(order.type, OrderType.OFFLINE)
    assert.equal(order.status, OrderStatus.IN_CLEANING)
    assert.equal(Number(order.totalPrice), 75_000)
    response.assertHeader('location', `/staff/orders/${order.orderNumber}/receipt`)
  })

  test('linking an account and asking for delivery makes a walk-in delivery', async ({
    client,
    assert,
  }) => {
    const catalogue = await CatalogueFactory.create()
    const customer = await createCustomer()

    const response = await client
      .post('/staff/orders')
      .loginAs(await staff())
      .withCsrfToken()
      .file('photo', PNG_PIXEL, { filename: 'bukti.png' })
      .fields(
        counterFields(catalogue.id, {
          customerId: String(customer.user.id),
          delivery: 'true',
        })
      )
      .redirects(0)

    response.assertStatus(302)

    const order = await Order.query().orderBy('id', 'desc').firstOrFail()

    assert.equal(order.type, OrderType.WALK_IN_DELIVERY)
    assert.equal(order.addressId, customer.address.id)
  })

  test('the receipt shows the change owed', async ({ client, assert }) => {
    const catalogue = await CatalogueFactory.merge({ price: '75000' }).create()
    const petugas = await staff()

    await client
      .post('/staff/orders')
      .loginAs(petugas)
      .withCsrfToken()
      .file('photo', PNG_PIXEL, { filename: 'bukti.png' })
      .fields(counterFields(catalogue.id))
      .redirects(0)

    const order = await Order.query().orderBy('id', 'desc').firstOrFail()

    const response = await client
      .get(`/staff/orders/${order.orderNumber}/receipt`)
      .loginAs(petugas)
      .withInertia()

    response.assertStatus(200)
    response.assertInertiaComponent('staff/order/receipt')
    assert.equal(response.inertiaProps.changeLabel, formatRupiah(425_000))
  })

  test('an order without a photo is rejected', async ({ client, assert }) => {
    const catalogue = await CatalogueFactory.create()

    const phone = '081200000199'

    const response = await client
      .post('/staff/orders')
      .loginAs(await staff())
      .withCsrfToken()
      .fields(counterFields(catalogue.id, { phone }))
      .redirects(0)

    response.assertStatus(302)
    assert.isNull(await Order.query().where('customer_phone', phone).first())
  })
})

test.group('Staff counter orders | correcting the goods', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  test('an order waiting to be paid can be corrected', async ({ client }) => {
    const customer = await createCustomer()
    const order = await createOrder(customer, {
      attributes: { status: OrderStatus.AWAITING_PAYMENT },
    })

    const response = await client
      .get(`/staff/orders/${order.orderNumber}/edit`)
      .loginAs(await staff())
      .withInertia()

    response.assertStatus(200)
    response.assertInertiaComponent('staff/order/edit')
    response.assertInertiaPropsContains({ canEdit: true, isCounterOrder: false })
  })

  test('an order at any other stage explains why it cannot be corrected', async ({ client }) => {
    const customer = await createCustomer()
    const order = await createOrder(customer, { states: ['inCleaning'] })

    const response = await client
      .get(`/staff/orders/${order.orderNumber}/edit`)
      .loginAs(await staff())
      .withInertia()

    response.assertStatus(200)
    response.assertInertiaPropsContains({ canEdit: false, isCounterOrder: false })
  })

  test('a counter order is marked as paid at the till', async ({ client }) => {
    const customer = await createCustomer()
    const order = await createOrder(
      { user: customer.user, address: null },
      { states: ['walkIn', 'inCleaning'] }
    )

    const response = await client
      .get(`/staff/orders/${order.orderNumber}/edit`)
      .loginAs(await staff())
      .withInertia()

    response.assertStatus(200)
    response.assertInertiaPropsContains({ canEdit: false, isCounterOrder: true })
  })

  test('correcting an order that is not awaiting payment is refused', async ({
    client,
    assert,
  }) => {
    const catalogue = await CatalogueFactory.create()
    const customer = await createCustomer()
    const order = await createOrder(customer, { states: ['inCleaning'] })

    const response = await client
      .put(`/staff/orders/${order.orderNumber}`)
      .loginAs(await staff())
      .withCsrfToken()
      .redirects(0)
      .form(
        itemFields([
          itemPayload({
            type: ItemType.SHOE,
            condition: 'Kotor ringan',
            catalogue: String(catalogue.id),
          }),
        ])
      )

    response.assertStatus(302)
    assert.property(inputErrors(response), 'form')
  })
})
