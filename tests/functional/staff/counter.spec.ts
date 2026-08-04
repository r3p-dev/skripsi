import { AddressFactory } from '#database/factories/address_factory'
import { OrderFactory } from '#database/factories/order_factory'
import { UserFactory } from '#database/factories/user_factory'
import { OrderStatus } from '#enums/order_status_enum'
import { OrderType } from '#enums/order_type_enum'
import { ServiceCategory, ServiceType } from '#enums/service_enum'
import Order from '#models/order'
import OrderAction from '#models/order_action'
import Service from '#models/service'
import Transaction from '#models/transaction'
import testUtils from '@adonisjs/core/services/test_utils'
import { test } from '@japa/runner'
import { fileURLToPath } from 'node:url'

const photoPath = fileURLToPath(new URL('../../fixtures/photo.png', import.meta.url))

function createService() {
  return Service.create({
    name: 'Cuci Sepatu Reguler',
    description: 'Cuci sepatu standar',
    category: ServiceCategory.SHOE_WASH,
    type: ServiceType.REGULAR,
    price: 30000,
  })
}

function fillCounterOrder(request: any, service: Service, phone: string) {
  return request
    .field('name', 'Budi')
    .field('phone', phone)
    .field('totalItems', '1')
    .file('photo', photoPath)
    .field('items[0][brand]', 'Nike')
    .field('items[0][model]', 'Air Max')
    .field('items[0][material]', 'Kanvas')
    .field('items[0][size]', '42')
    .field('items[0][condition]', 'Kotor ringan')
    .field('items[0][type]', 'shoe')
    .field('items[0][service]', String(service.id))
}

test.group('Staff counter — registered customers', (group) => {
  group.each.setup(() => testUtils.db().truncate())

  /**
   * Somebody who books online and then one day carries their shoes in is the
   * same person. Retyping their details at the counter creates a second one:
   * an order their own history will never show.
   */
  test('a walk-in can be bound to the account the customer already has', async ({
    client,
    assert,
  }) => {
    const staff = await UserFactory.apply('staff').merge({ phone: '081277770001' }).create()
    const customer = await UserFactory.merge({ phone: '081277770002' }).create()
    const service = await createService()

    await fillCounterOrder(client.post('/staff/orders').loginAs(staff), service, '081277770002')
      .field('customerId', String(customer.id))
      .field('paymentMethod', 'debit')
      .withCsrfToken()

    const order = await Order.query().where('customerPhone', '081277770002').firstOrFail()

    assert.equal(order.userId, customer.id)
    assert.equal(order.type, OrderType.OFFLINE)
  })

  /**
   * Delivery needs somewhere to deliver to, and the only address the system
   * trusts is the one the customer pinned on a map themselves. That lives on
   * their account, which is why it is offered only once one has been picked.
   */
  test('a bound walk-in can ask for delivery to the address on the account', async ({
    client,
    assert,
  }) => {
    const staff = await UserFactory.apply('staff').merge({ phone: '081277771001' }).create()
    const customer = await UserFactory.merge({ phone: '081277771002' }).create()
    const address = await AddressFactory.merge({ userId: customer.id, isActive: true }).create()
    const service = await createService()

    await fillCounterOrder(client.post('/staff/orders').loginAs(staff), service, '081277771002')
      .field('customerId', String(customer.id))
      .field('delivery', 'true')
      .field('paymentMethod', 'debit')
      .withCsrfToken()

    const order = await Order.query().where('customerPhone', '081277771002').firstOrFail()

    assert.equal(order.type, OrderType.WALK_IN_DELIVERY)
    assert.equal(order.addressId, address.id)
  })

  test('delivery is refused for a walk-in with no account behind it', async ({
    client,
    assert,
  }) => {
    const staff = await UserFactory.apply('staff').merge({ phone: '081277772001' }).create()
    const service = await createService()

    const response = await fillCounterOrder(
      client.post('/staff/orders').withInertia().loginAs(staff),
      service,
      '081277772002'
    )
      .header('referer', '/staff/orders/create')
      .field('delivery', 'true')
      .field('paymentMethod', 'debit')
      .withCsrfToken()

    response.assertInertiaPropsContains({
      errors: { delivery: 'Pengantaran hanya tersedia untuk pelanggan yang sudah terdaftar.' },
    })

    assert.lengthOf(await Order.query().where('customerPhone', '081277772002'), 0)
  })

  test('delivery is refused when the account has no live address', async ({ client, assert }) => {
    const staff = await UserFactory.apply('staff').merge({ phone: '081277773001' }).create()
    const customer = await UserFactory.merge({ phone: '081277773002' }).create()
    const service = await createService()

    const response = await fillCounterOrder(
      client.post('/staff/orders').withInertia().loginAs(staff),
      service,
      '081277773002'
    )
      .header('referer', '/staff/orders/create')
      .field('customerId', String(customer.id))
      .field('delivery', 'true')
      .field('paymentMethod', 'debit')
      .withCsrfToken()

    response.assertInertiaPropsContains({
      errors: { delivery: 'Pelanggan ini belum memiliki alamat aktif untuk pengantaran.' },
    })

    assert.lengthOf(await Order.query().where('customerPhone', '081277773002'), 0)
  })

  test('a bound walk-in with an address goes out for delivery once washed', async ({
    client,
    assert,
  }) => {
    const staff = await UserFactory.apply('staff').merge({ phone: '081277774001' }).create()
    const customer = await UserFactory.merge({ phone: '081277774002' }).create()
    const address = await AddressFactory.merge({ userId: customer.id, isActive: true }).create()

    const order = await OrderFactory.apply('inCleaning')
      .merge({
        userId: customer.id,
        addressId: address.id,
        type: OrderType.WALK_IN_DELIVERY,
      })
      .create()

    await client
      .put(`/staff/cleanings/${order.orderNumber}`)
      .loginAs(staff)
      .file('photo', photoPath)
      .withCsrfToken()

    await order.refresh()
    assert.equal(order.status, OrderStatus.IN_DELIVERY)
  })
})

test.group('Staff counter — cash and change', (group) => {
  group.each.setup(() => testUtils.db().truncate())

  test('the cash tendered is recorded so the change is on the receipt', async ({
    client,
    assert,
  }) => {
    const staff = await UserFactory.apply('staff').merge({ phone: '081277775001' }).create()
    const service = await createService()

    await fillCounterOrder(client.post('/staff/orders').loginAs(staff), service, '081277775002')
      .field('paymentMethod', 'cash')
      .field('cashReceived', '50000')
      .withCsrfToken()

    const order = await Order.query().where('customerPhone', '081277775002').firstOrFail()
    const transaction = await Transaction.query().where('orderId', order.id).firstOrFail()

    assert.equal(Number(transaction.cashReceived), 50000)

    const receipt = await client
      .get(`/staff/orders/${order.orderNumber}/receipt`)
      .withInertia()
      .loginAs(staff)

    receipt.assertInertiaComponent('staff/order/receipt')
    assert.equal(receipt.inertiaProps.change, 20000)
  })

  /**
   * The counter form works out the change as staff type, so this should never
   * fire from the interface. It is here because a payload saying the customer
   * handed over less than the total would otherwise be recorded as a settled
   * order with a negative amount of change owed.
   */
  test('cash that does not cover the bill leaves no order behind', async ({ client, assert }) => {
    const staff = await UserFactory.apply('staff').merge({ phone: '081277776001' }).create()
    const service = await createService()

    const response = await fillCounterOrder(
      client.post('/staff/orders').withInertia().loginAs(staff),
      service,
      '081277776002'
    )
      .header('referer', '/staff/orders/create')
      .field('paymentMethod', 'cash')
      .field('cashReceived', '10000')
      .withCsrfToken()

    response.assertInertiaPropsContains({
      errors: { cashReceived: 'Uang yang diterima kurang dari total pesanan.' },
    })

    assert.lengthOf(await Order.query().where('customerPhone', '081277776002'), 0)
  })
})

test.group('Staff counter — customer lookup', (group) => {
  group.each.setup(() => testUtils.db().truncate())

  test('finds a registered customer by name', async ({ client, assert }) => {
    const staff = await UserFactory.apply('staff').merge({ phone: '081277777001' }).create()
    await UserFactory.merge({ name: 'Siti Rahayu', phone: '081277777002' }).create()

    const response = await client.get('/staff/customers').qs({ search: 'Siti' }).loginAs(staff)

    response.assertStatus(200)
    assert.equal(response.body().customers[0].phone, '081277777002')
  })

  /**
   * The lookup reads the whole customer list, and a search box is not a place
   * to browse it from. A term too short to be a real search returns nothing
   * rather than everybody.
   */
  test('a term too short to be a search returns nobody', async ({ client, assert }) => {
    const staff = await UserFactory.apply('staff').merge({ phone: '081277778001' }).create()
    await UserFactory.merge({ name: 'Siti Rahayu', phone: '081277778002' }).create()

    const response = await client.get('/staff/customers').qs({ search: 'Si' }).loginAs(staff)

    assert.isEmpty(response.body().customers)
  })

  test('never returns staff or admin accounts', async ({ client, assert }) => {
    const staff = await UserFactory.apply('staff').merge({ phone: '081277779001' }).create()
    await UserFactory.apply('admin').merge({ name: 'Admin Utama', phone: '081277779002' }).create()

    const response = await client.get('/staff/customers').qs({ search: 'Admin' }).loginAs(staff)

    assert.isEmpty(response.body().customers)
  })
})

test.group('Staff counter — messaging a customer', (group) => {
  group.each.setup(() => testUtils.db().truncate())

  /**
   * Telling somebody to come and collect shoes that are still in the wash — or
   * in the back of a van — is worse than saying nothing, so the guard is on
   * the status rather than on the staff member's judgement alone.
   */
  test('the ready notice is refused for an order that is not on the shelf', async ({
    client,
    assert,
  }) => {
    const staff = await UserFactory.apply('staff').merge({ phone: '081277780001' }).create()
    const order = await OrderFactory.apply('inCleaning').create()

    const response = await client
      .post(`/staff/orders/${order.orderNumber}/notifications`)
      .withInertia()
      .loginAs(staff)
      .header('referer', '/staff/trips')
      .json({ notice: 'ready' })
      .withCsrfToken()

    response.assertInertiaPropsContains({
      errors: { status: 'Pesanan ini belum siap diambil di toko.' },
    })

    assert.lengthOf(await OrderAction.query().where('order_id', order.id), 0)
  })

  test('the payment reminder is refused for an order that is already paid for', async ({
    client,
    assert,
  }) => {
    const staff = await UserFactory.apply('staff').merge({ phone: '081277781001' }).create()
    const order = await OrderFactory.apply('inCleaning').create()

    const response = await client
      .post(`/staff/orders/${order.orderNumber}/notifications`)
      .withInertia()
      .loginAs(staff)
      .header('referer', '/staff/trips')
      .json({ notice: 'payment' })
      .withCsrfToken()

    response.assertInertiaPropsContains({
      errors: { status: 'Pesanan ini tidak sedang menunggu pembayaran.' },
    })

    assert.lengthOf(await OrderAction.query().where('order_id', order.id), 0)
  })

  /**
   * A closed list rather than free text: this sends a WhatsApp from the shop's
   * own number, and what leaves under the shop's name is not something an
   * order screen should let anyone compose on the spot.
   */
  test('an unrecognised message is refused outright', async ({ client }) => {
    const staff = await UserFactory.apply('staff').merge({ phone: '081277782001' }).create()
    const order = await OrderFactory.apply('inCleaning').create()

    const response = await client
      .post(`/staff/orders/${order.orderNumber}/notifications`)
      .withInertia()
      .loginAs(staff)
      .header('referer', '/staff/trips')
      .json({ notice: 'diskon' as never })
      .withCsrfToken()

    response.assertInertiaPropsContains({
      errors: { notice: 'notice yang dipilih tidak valid' },
    })
  })
})
