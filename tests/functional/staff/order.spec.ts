import { UserFactory } from '#database/factories/user_factory'
import { OrderFactory } from '#database/factories/order_factory'
import Item from '#models/item'
import Order from '#models/order'
import OrderAction from '#models/order_action'
import OrderItem from '#models/order_item'
import Transaction from '#models/transaction'
import Service from '#models/service'
import { ItemType, ServiceCategory, ServiceType } from '#enums/service_enum'
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

  test('a walk-in order is stored as an offline order with no account or address', async ({
    client,
    assert,
  }) => {
    const staff = await UserFactory.apply('staff').create()
    const service = await createMainService()

    await fillOfflineOrder(client.post('/staff/orders').loginAs(staff), service, '081211110005')
      .field('paymentMethod', 'cash')
      .withCsrfToken()

    const order = await Order.query().where('customerPhone', '081211110005').firstOrFail()

    // The type is what the admin dashboard groups on, and the missing address is
    // what makes cleaning complete the order instead of sending it for delivery.
    assert.equal(order.type, 'offline')
    assert.isNull(order.userId)
    assert.isNull(order.addressId)

    const action = await OrderAction.query().where('orderId', order.id).firstOrFail()
    assert.equal(action.name, 'offline_order')
    assert.equal(action.staffId, staff.id)
    assert.equal(action.note, 'Titipan sepatu')
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

test.group('Staff Order Item Editing', (group) => {
  group.each.setup(() => testUtils.db().truncate())

  /**
   * An order as it stands right after inspection: priced, awaiting payment, and
   * still correctable.
   */
  async function createInspectedOrder(service: Service) {
    const order = await OrderFactory.apply('waitingPayment').merge({ totalPrice: 30000 }).create()

    const item = await Item.create({
      type: ItemType.SHOE,
      brand: 'Nike',
      model: 'Air Max',
      material: 'Kanvas',
      size: '42',
      condition: 'Kotor ringan',
      note: null,
    })

    await OrderItem.create({
      orderId: order.id,
      itemId: item.id,
      serviceId: service.id,
      name: `${service.name} - ${item.brand} ${item.model}`,
      price: 30000,
      subtotal: 30000,
    })

    return { order, item }
  }

  test('GET /staff/orders/:number/items renders the recorded items', async ({ client, assert }) => {
    const staff = await UserFactory.apply('staff').create()
    const service = await createMainService()
    const { order } = await createInspectedOrder(service)

    const response = await client
      .get(`/staff/orders/${order.orderNumber}/items`)
      .withInertia()
      .loginAs(staff)

    response.assertInertiaComponent('staff/order/edit')
    assert.equal(response.inertiaProps.items[0].item.brand, 'Nike')
    assert.equal(response.inertiaProps.items[0].service.id, service.id)
    assert.isTrue(
      response.inertiaProps.services.some((item: { id: number }) => item.id === service.id)
    )
  })

  test('correcting the items reprices the order', async ({ client, assert }) => {
    const staff = await UserFactory.apply('staff').create()
    const service = await createMainService()
    const premiumService = await Service.create({
      name: 'Cuci Sepatu Premium',
      description: 'Cuci sepatu menyeluruh',
      category: ServiceCategory.SHOE_WASH,
      type: ServiceType.REGULAR,
      price: 75000,
    })
    const { order, item } = await createInspectedOrder(service)

    const response = await client
      .put(`/staff/orders/${order.orderNumber}/items`)
      .loginAs(staff)
      .field('items[0][brand]', 'Adidas')
      .field('items[0][model]', 'Samba')
      .field('items[0][material]', 'Suede')
      .field('items[0][size]', '43')
      .field('items[0][condition]', 'Kotor berat')
      .field('items[0][type]', 'shoe')
      .field('items[0][service]', String(premiumService.id))
      .withCsrfToken()

    response.assertRedirectsTo('/staff/trips')

    await order.refresh()
    assert.equal(Number(order.totalPrice), 75000)

    const orderItems = await OrderItem.query().where('orderId', order.id).preload('item')
    assert.lengthOf(orderItems, 1)
    assert.equal(orderItems[0].item.brand, 'Adidas')
    assert.equal(orderItems[0].serviceId, premiumService.id)

    // The mistyped item is gone rather than orphaned alongside the correction.
    assert.isNull(await Item.find(item.id))

    const action = await OrderAction.query()
      .where('orderId', order.id)
      .where('name', 'items_edited')
      .firstOrFail()
    assert.equal(action.staffId, staff.id)
  })

  test('items can no longer be corrected once the customer has paid', async ({
    client,
    assert,
  }) => {
    const staff = await UserFactory.apply('staff').create()
    const service = await createMainService()

    // Paying moves the order into cleaning, which closes the correction window.
    const order = await OrderFactory.apply('inCleaning').create()
    const totalBefore = Number(order.totalPrice)

    const page = await client.get(`/staff/orders/${order.orderNumber}/items`).loginAs(staff)
    page.assertStatus(404)

    const update = await client
      .put(`/staff/orders/${order.orderNumber}/items`)
      .loginAs(staff)
      .field('items[0][brand]', 'Adidas')
      .field('items[0][model]', 'Samba')
      .field('items[0][material]', 'Suede')
      .field('items[0][size]', '43')
      .field('items[0][condition]', 'Kotor berat')
      .field('items[0][type]', 'shoe')
      .field('items[0][service]', String(service.id))
      .withCsrfToken()

    update.assertStatus(404)

    await order.refresh()
    assert.equal(Number(order.totalPrice), totalBefore)
  })
})
