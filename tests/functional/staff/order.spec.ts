import { UserFactory } from '#database/factories/user_factory'
import Order from '#models/order'
import Transaction from '#models/transaction'
import Service from '#models/service'
import { ServiceCategory, ServiceType } from '#enums/service_enum'
import testUtils from '@adonisjs/core/services/test_utils'
import { test } from '@japa/runner'

function createMainService() {
  return Service.create({
    name: 'Cuci Sepatu Reguler',
    description: 'Cuci sepatu standar',
    category: ServiceCategory.SHOE_WASH,
    type: ServiceType.REGULAR,
    price: 30000,
  })
}

function fillOfflineOrder(request: any, service: Service, phone: string) {
  return request
    .field('name', 'Budi')
    .field('phone', phone)
    .field('totalItems', '1')
    .field('note', 'Titipan sepatu')
    .field('items[0][brand]', 'Nike')
    .field('items[0][model]', 'Air Max')
    .field('items[0][material]', 'Kanvas')
    .field('items[0][size]', '42')
    .field('items[0][condition]', 'Kotor ringan')
    .field('items[0][type]', 'shoe')
    .field('items[0][service]', String(service.id))
}

test.group('Staff Offline Order', (group) => {
  group.each.setup(() => testUtils.db().truncate())

  test('GET /staff/orders/create renders available services', async ({ client, assert }) => {
    const staff = await UserFactory.apply('staff').create()
    const service = await createMainService()

    const response = await client.get('/staff/orders/create').withInertia().loginAs(staff)

    assert.isTrue(
      response.inertiaProps.services.some((item: { id: number }) => item.id === service.id)
    )
  })

  test('creating an offline order starts it in cleaning with items priced correctly', async ({
    client,
    assert,
  }) => {
    const staff = await UserFactory.apply('staff').create()
    const service = await createMainService()

    const response = await fillOfflineOrder(
      client.post('/staff/orders').loginAs(staff),
      service,
      '081211110001'
    )
      .field('paymentMethod', 'cash')
      .withCsrfToken()

    response.assertRedirectsTo('/staff/trips')

    const order = await Order.query().where('customerPhone', '081211110001').firstOrFail()
    assert.equal(order.status, 'in_cleaning')
    assert.equal(Number(order.totalPrice), 30000)
  })

  test('cash payment is marked as paid immediately', async ({ client, assert }) => {
    const staff = await UserFactory.apply('staff').create()
    const service = await createMainService()

    await fillOfflineOrder(client.post('/staff/orders').loginAs(staff), service, '081211110002')
      .field('paymentMethod', 'cash')
      .withCsrfToken()

    const order = await Order.query().where('customerPhone', '081211110002').firstOrFail()
    const transaction = await Transaction.query().where('orderId', order.id).firstOrFail()

    assert.equal(transaction.paymentMethod, 'cash')
    assert.equal(transaction.status, 'paid')
  })

  test('debit payment is marked as paid immediately', async ({ client, assert }) => {
    const staff = await UserFactory.apply('staff').create()
    const service = await createMainService()

    await fillOfflineOrder(client.post('/staff/orders').loginAs(staff), service, '081211110003')
      .field('paymentMethod', 'debit')
      .withCsrfToken()

    const order = await Order.query().where('customerPhone', '081211110003').firstOrFail()
    const transaction = await Transaction.query().where('orderId', order.id).firstOrFail()

    assert.equal(transaction.paymentMethod, 'debit')
    assert.equal(transaction.status, 'paid')
  })

  test('qris payment starts a pending Midtrans transaction with a QR code', async ({
    client,
    assert,
  }) => {
    const staff = await UserFactory.apply('staff').create()
    const service = await createMainService()

    const response = await fillOfflineOrder(
      client.post('/staff/orders').loginAs(staff),
      service,
      '081211110004'
    )
      .field('paymentMethod', 'qris')
      .withCsrfToken()

    const order = await Order.query().where('customerPhone', '081211110004').firstOrFail()

    response.assertRedirectsTo(`/staff/orders/${order.orderNumber}/transactions/latest`)

    const transaction = await Transaction.query().where('orderId', order.id).firstOrFail()
    assert.equal(transaction.paymentMethod, 'qris')
    assert.equal(transaction.status, 'pending')
    assert.isNotNull(transaction.qrCode)
  }).timeout(30000)
})
