import { AddressFactory } from '#database/factories/address_factory'
import { OrderFactory } from '#database/factories/order_factory'
import { UserFactory } from '#database/factories/user_factory'
import Order from '#models/order'
import testUtils from '@adonisjs/core/services/test_utils'
import { test } from '@japa/runner'
import { DateTime } from 'luxon'

function isoDate(date: DateTime) {
  return date.toFormat('yyyy-MM-dd')
}

async function createCustomerWithAddress(phone: string) {
  const customer = await UserFactory.merge({ phone }).create()
  const address = await AddressFactory.merge({ userId: customer.id, isActive: true }).create()

  return { customer, address }
}

test.group('Customer Order Creation', (group) => {
  group.each.setup(() => testUtils.db().truncate())

  test('GET /order renders the booking form with the active address', async ({
    client,
    assert,
  }) => {
    const { customer, address } = await createCustomerWithAddress('081211112001')

    const response = await client.get('/order').withInertia().loginAs(customer)

    response.assertInertiaComponent('customer/order/create')
    assert.equal(response.inertiaProps.address.id, address.id)
  })

  test('GET /order renders without an address so the page can prompt for one', async ({
    client,
    assert,
  }) => {
    const customer = await UserFactory.merge({ phone: '081211112002' }).create()

    const response = await client.get('/order').withInertia().loginAs(customer)

    assert.isNull(response.inertiaProps.address)
  })

  test('POST /orders books a pickup and starts the order awaiting collection', async ({
    client,
    assert,
  }) => {
    const { customer, address } = await createCustomerWithAddress('081211112003')
    const pickupDate = DateTime.now().plus({ days: 3 })

    const response = await client
      .post('/orders')
      .loginAs(customer)
      .json({ addressId: address.id, pickupDate: isoDate(pickupDate) })
      .withCsrfToken()

    const order = await Order.query().where('user_id', customer.id).firstOrFail()

    response.assertRedirectsTo(`/orders/${order.orderNumber}`)

    assert.equal(order.status, 'pickup_scheduled')
    assert.equal(order.type, 'online')
    assert.equal(order.addressId, address.id)
    assert.isNull(order.totalPrice)
  })

  test('the recipient is taken from the address, not the account', async ({ client, assert }) => {
    const { customer, address } = await createCustomerWithAddress('081211112009')

    await client
      .post('/orders')
      .loginAs(customer)
      .json({
        addressId: address.id,
        pickupDate: isoDate(DateTime.now().plus({ days: 3 })),
      })
      .withCsrfToken()

    const order = await Order.query().where('user_id', customer.id).firstOrFail()

    // A customer may be ordering for someone else, so staff need the name and
    // number of whoever is actually at that door.
    assert.equal(order.customerName, address.name)
    assert.equal(order.customerPhone, address.phone)
    assert.notEqual(order.customerName, customer.name)
  })

  test('order numbers follow ORDYYMMDD-NNN and increment within the same day', async ({
    client,
    assert,
  }) => {
    const { customer, address } = await createCustomerWithAddress('081211112004')
    const pickupDate = isoDate(DateTime.now().plus({ days: 2 }))

    await client
      .post('/orders')
      .loginAs(customer)
      .json({ addressId: address.id, pickupDate })
      .withCsrfToken()

    await client
      .post('/orders')
      .loginAs(customer)
      .json({ addressId: address.id, pickupDate })
      .withCsrfToken()

    const orders = await Order.query().where('user_id', customer.id).orderBy('id', 'asc')
    const prefix = `ORD${DateTime.now().toFormat('yyLLdd')}`

    assert.equal(orders[0].orderNumber, `${prefix}-001`)
    assert.equal(orders[1].orderNumber, `${prefix}-002`)
  })

  /**
   * A collection booked for today cannot actually happen: the van is already
   * out on a route planned this morning, and the customer would be left
   * watching a stop nobody is coming to. Refusing it at the form is kinder
   * than accepting it and disappointing them.
   */
  test('POST /orders refuses a pickup booked for today', async ({ client, assert }) => {
    const customer = await UserFactory.merge({ phone: '081266660010' }).create()
    const address = await AddressFactory.merge({ userId: customer.id }).create()

    const response = await client
      .post('/orders')
      .withInertia()
      .loginAs(customer)
      .header('referer', '/order')
      .json({ addressId: address.id, pickupDate: isoDate(DateTime.now()) })
      .withCsrfToken()

    response.assertInertiaPropsContains({
      errors: { pickupDate: 'Tanggal penjemputan harus setelah today' },
    })

    assert.lengthOf(await Order.query().where('user_id', customer.id), 0)
  })

  test('POST /orders rejects a pickup date once the day is fully booked', async ({
    client,
    assert,
  }) => {
    const { customer, address } = await createCustomerWithAddress('081211112005')
    const pickupDate = DateTime.now().plus({ days: 4 })

    await OrderFactory.merge({ pickupDate }).createMany(10)

    const response = await client
      .post('/orders')
      .withInertia()
      .loginAs(customer)
      .header('referer', '/order')
      .json({ addressId: address.id, pickupDate: isoDate(pickupDate) })
      .withCsrfToken()

    response.assertInertiaPropsContains({
      errors: { pickupDate: 'Batas penjemputan per hari sudah penuh untuk tanggal ini.' },
    })

    assert.lengthOf(await Order.query().where('user_id', customer.id), 0)
  })

  test('POST /orders refuses an address belonging to another customer', async ({
    client,
    assert,
  }) => {
    const customer = await UserFactory.merge({ phone: '081211112006' }).create()
    const { address: strangerAddress } = await createCustomerWithAddress('081211112007')

    const response = await client
      .post('/orders')
      .withInertia()
      .loginAs(customer)
      .header('referer', '/order')
      .json({
        addressId: strangerAddress.id,
        pickupDate: isoDate(DateTime.now().plus({ days: 1 })),
      })
      .withCsrfToken()

    response.assertInertiaPropsContains({
      errors: { addressId: 'Alamat penjemputan tidak ditemukan.' },
    })

    assert.lengthOf(await Order.query().where('user_id', customer.id), 0)
  })

  test('POST /orders validates the payload', async ({ client }) => {
    const customer = await UserFactory.merge({ phone: '081211112008' }).create()

    const response = await client
      .post('/orders')
      .withInertia()
      .loginAs(customer)
      .header('referer', '/order')
      .json({ addressId: -1, pickupDate: 'not-a-date' })
      .withCsrfToken()

    response.assertInertiaPropsContains({
      errors: {
        addressId: 'addressId harus bernilai positif',
        pickupDate: 'Tanggal penjemputan harus berupa tanggal yang valid',
      },
    })
  })
})

test.group('Customer Order Browsing', (group) => {
  group.each.setup(() => testUtils.db().truncate())

  test('GET /orders lists only the signed-in customer own orders', async ({ client, assert }) => {
    const customer = await UserFactory.merge({ phone: '081211113001' }).create()
    const stranger = await UserFactory.merge({ phone: '081211113002' }).create()

    const own = await OrderFactory.merge({ userId: customer.id }).create()
    const other = await OrderFactory.merge({ userId: stranger.id }).create()

    const response = await client.get('/orders').withInertia().loginAs(customer)

    response.assertInertiaComponent('customer/order/index')

    const orderNumbers = response.inertiaProps.orders.data.map(
      (order: { orderNumber: string }) => order.orderNumber
    )
    assert.include(orderNumbers, own.orderNumber)
    assert.notInclude(orderNumbers, other.orderNumber)
  })

  test('GET /orders filters by order number', async ({ client, assert }) => {
    const customer = await UserFactory.merge({ phone: '081211113003' }).create()

    const wanted = await OrderFactory.merge({
      userId: customer.id,
      orderNumber: 'ORD990101-777',
    }).create()
    await OrderFactory.merge({ userId: customer.id, orderNumber: 'ORD990101-888' }).create()

    const response = await client
      .get('/orders')
      .qs({ search: 'ORD990101-777' })
      .withInertia()
      .loginAs(customer)

    const orderNumbers = response.inertiaProps.orders.data.map(
      (order: { orderNumber: string }) => order.orderNumber
    )
    assert.deepEqual(orderNumbers, [wanted.orderNumber])
  })

  test('GET /orders paginates ten orders per page', async ({ client, assert }) => {
    const customer = await UserFactory.merge({ phone: '081211113004' }).create()
    await OrderFactory.merge({ userId: customer.id }).createMany(12)

    const firstPage = await client.get('/orders').withInertia().loginAs(customer)
    assert.lengthOf(firstPage.inertiaProps.orders.data, 10)
    assert.equal(firstPage.inertiaProps.orders.metadata.lastPage, 2)

    const secondPage = await client.get('/orders').qs({ page: 2 }).withInertia().loginAs(customer)
    assert.lengthOf(secondPage.inertiaProps.orders.data, 2)
  })

  test('GET /orders/:number shows the customer their own order', async ({ client, assert }) => {
    const customer = await UserFactory.merge({ phone: '081211113005' }).create()
    const order = await OrderFactory.merge({ userId: customer.id }).create()

    const response = await client
      .get(`/orders/${order.orderNumber}`)
      .withInertia()
      .loginAs(customer)

    response.assertInertiaComponent('customer/order/show')
    assert.equal(response.inertiaProps.order.orderNumber, order.orderNumber)
  })

  test('GET /orders/:number hides another customer order', async ({ client }) => {
    const customer = await UserFactory.merge({ phone: '081211113006' }).create()
    const stranger = await UserFactory.merge({ phone: '081211113007' }).create()
    const order = await OrderFactory.merge({ userId: stranger.id }).create()

    const response = await client.get(`/orders/${order.orderNumber}`).loginAs(customer)

    response.assertStatus(404)
  })

  test('GET /orders/:number/receipt renders the printable receipt', async ({ client, assert }) => {
    const customer = await UserFactory.merge({ phone: '081211113008' }).create()
    const order = await OrderFactory.apply('completed').merge({ userId: customer.id }).create()

    const response = await client
      .get(`/orders/${order.orderNumber}/receipt`)
      .withInertia()
      .loginAs(customer)

    response.assertInertiaComponent('customer/order/receipt')
    assert.equal(response.inertiaProps.order.orderNumber, order.orderNumber)
  })
})

test.group('Customer Order Cancellation', (group) => {
  group.each.setup(() => testUtils.db().truncate())

  test('a scheduled order can be cancelled before its pickup day', async ({ client, assert }) => {
    const customer = await UserFactory.merge({ phone: '081211114001' }).create()
    const order = await OrderFactory.merge({
      userId: customer.id,
      pickupDate: DateTime.now().plus({ days: 2 }),
    }).create()

    const response = await client
      .put(`/orders/${order.orderNumber}`)
      .loginAs(customer)
      .withCsrfToken()

    response.assertRedirectsTo(`/orders/${order.orderNumber}`)

    await order.refresh()
    assert.equal(order.status, 'cancelled')
  })

  test('an order cannot be cancelled on its pickup day', async ({ client, assert }) => {
    const customer = await UserFactory.merge({ phone: '081211114002' }).create()
    const order = await OrderFactory.merge({
      userId: customer.id,
      pickupDate: DateTime.now(),
    }).create()

    const response = await client
      .put(`/orders/${order.orderNumber}`)
      .withInertia()
      .loginAs(customer)
      .header('referer', `/orders/${order.orderNumber}`)
      .withCsrfToken()

    response.assertInertiaPropsContains({
      errors: { status: 'Pesanan hanya dapat dibatalkan sebelum tanggal penjemputan.' },
    })

    await order.refresh()
    assert.equal(order.status, 'pickup_scheduled')
  })

  test('an order already collected cannot be cancelled', async ({ client, assert }) => {
    const customer = await UserFactory.merge({ phone: '081211114003' }).create()
    const order = await OrderFactory.apply('inInspection')
      .merge({ userId: customer.id, pickupDate: DateTime.now().plus({ days: 2 }) })
      .create()

    const response = await client
      .put(`/orders/${order.orderNumber}`)
      .withInertia()
      .loginAs(customer)
      .header('referer', `/orders/${order.orderNumber}`)
      .withCsrfToken()

    response.assertInertiaPropsContains({
      errors: { status: 'Pesanan hanya dapat dibatalkan sebelum tanggal penjemputan.' },
    })

    await order.refresh()
    assert.equal(order.status, 'in_inspection')
  })

  test('a customer cannot cancel another customer order', async ({ client, assert }) => {
    const customer = await UserFactory.merge({ phone: '081211114004' }).create()
    const stranger = await UserFactory.merge({ phone: '081211114005' }).create()
    const order = await OrderFactory.merge({
      userId: stranger.id,
      pickupDate: DateTime.now().plus({ days: 2 }),
    }).create()

    const response = await client
      .put(`/orders/${order.orderNumber}`)
      .loginAs(customer)
      .withCsrfToken()

    response.assertStatus(404)

    await order.refresh()
    assert.equal(order.status, 'pickup_scheduled')
  })
})
