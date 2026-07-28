import { OrderFactory } from '#database/factories/order_factory'
import { UserFactory } from '#database/factories/user_factory'
import { ItemType, ServiceCategory, ServiceType } from '#enums/service_enum'
import { ActionName } from '#enums/order_action_enum'
import Item from '#models/item'
import OrderAction from '#models/order_action'
import OrderItem from '#models/order_item'
import Service from '#models/service'
import testUtils from '@adonisjs/core/services/test_utils'
import { test } from '@japa/runner'

test.group('Admin Order Monitor', (group) => {
  group.each.setup(() => testUtils.db().truncate())

  test('GET /admin/orders lists every order, not just one customer', async ({ client, assert }) => {
    const admin = await UserFactory.apply('admin').merge({ phone: '081310000001' }).create()
    const customer = await UserFactory.merge({ phone: '081310000002' }).create()

    await OrderFactory.merge({ userId: customer.id }).create()
    await OrderFactory.apply('offline').create()

    const response = await client.get('/admin/orders').withInertia().loginAs(admin)

    response.assertInertiaComponent('admin/order/index')
    assert.lengthOf(response.inertiaProps.orders.data, 2)
  })

  test('the list narrows by status', async ({ client, assert }) => {
    const admin = await UserFactory.apply('admin').merge({ phone: '081310001001' }).create()
    const cleaning = await OrderFactory.apply('inCleaning').create()
    await OrderFactory.apply('completed').create()

    const response = await client
      .get('/admin/orders')
      .qs({ status: 'in_cleaning' })
      .withInertia()
      .loginAs(admin)

    assert.lengthOf(response.inertiaProps.orders.data, 1)
    assert.equal(response.inertiaProps.orders.data[0].orderNumber, cleaning.orderNumber)
  })

  test('the list narrows by type', async ({ client, assert }) => {
    const admin = await UserFactory.apply('admin').merge({ phone: '081310002001' }).create()
    const walkIn = await OrderFactory.apply('offline').create()
    await OrderFactory.create()

    const response = await client
      .get('/admin/orders')
      .qs({ type: 'offline' })
      .withInertia()
      .loginAs(admin)

    assert.lengthOf(response.inertiaProps.orders.data, 1)
    assert.equal(response.inertiaProps.orders.data[0].orderNumber, walkIn.orderNumber)
  })

  test('the search matches the order number, the name and the phone', async ({
    client,
    assert,
  }) => {
    const admin = await UserFactory.apply('admin').merge({ phone: '081310003001' }).create()
    const order = await OrderFactory.merge({
      customerName: 'Siti Rahayu',
      customerPhone: '081310003999',
    }).create()
    await OrderFactory.merge({ customerName: 'Budi Santoso' }).create()

    for (const search of [order.orderNumber, 'Siti', '081310003999']) {
      const response = await client
        .get('/admin/orders')
        .qs({ search })
        .withInertia()
        .loginAs(admin)

      assert.lengthOf(response.inertiaProps.orders.data, 1)
      assert.equal(response.inertiaProps.orders.data[0].orderNumber, order.orderNumber)
    }
  })

  /**
   * A hand-edited query string must not produce an empty list under a filter
   * that does not exist — it reads as "there are no orders".
   */
  test('an unknown status in the query string is ignored', async ({ client, assert }) => {
    const admin = await UserFactory.apply('admin').merge({ phone: '081310004001' }).create()
    await OrderFactory.createMany(2)

    const response = await client
      .get('/admin/orders')
      .qs({ status: 'on_fire' })
      .withInertia()
      .loginAs(admin)

    assert.lengthOf(response.inertiaProps.orders.data, 2)
    assert.equal(response.inertiaProps.filters.status, '')
  })

  test('the list is paginated ten at a time', async ({ client, assert }) => {
    const admin = await UserFactory.apply('admin').merge({ phone: '081310005001' }).create()
    await OrderFactory.createMany(12)

    const response = await client.get('/admin/orders').withInertia().loginAs(admin)

    assert.lengthOf(response.inertiaProps.orders.data, 10)
    assert.equal(response.inertiaProps.orders.metadata.total, 12)
    assert.equal(response.inertiaProps.orders.metadata.lastPage, 2)
  })

  test('GET /admin/orders/:number shows the lines, transactions and audit trail', async ({
    client,
    assert,
  }) => {
    const admin = await UserFactory.apply('admin').merge({ phone: '081310006001' }).create()
    const staff = await UserFactory.apply('staff').merge({ phone: '081310006002' }).create()

    const service = await Service.create({
      name: 'Cuci Sepatu Reguler',
      description: 'Cuci sepatu standar',
      category: ServiceCategory.SHOE_WASH,
      type: ServiceType.REGULAR,
      price: 30000,
    })

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

    await OrderAction.create({
      orderId: order.id,
      staffId: staff.id,
      name: ActionName.INSPECTION,
      photoPath: null,
      note: null,
    })

    const response = await client
      .get(`/admin/orders/${order.orderNumber}`)
      .withInertia()
      .loginAs(admin)

    response.assertInertiaComponent('admin/order/show')
    assert.equal(response.inertiaProps.order.orderNumber, order.orderNumber)
    assert.equal(response.inertiaProps.items[0].item.brand, 'Nike')
    assert.equal(response.inertiaProps.items[0].service.name, 'Cuci Sepatu Reguler')
    assert.equal(response.inertiaProps.actions[0].staff.name, staff.name)
  })

  test('an unknown order number is a 404', async ({ client }) => {
    const admin = await UserFactory.apply('admin').merge({ phone: '081310007001' }).create()

    const response = await client.get('/admin/orders/ORD999999-001').loginAs(admin)

    response.assertStatus(404)
  })

  test('staff cannot reach the admin order monitor', async ({ client }) => {
    const staff = await UserFactory.apply('staff').merge({ phone: '081310008001' }).create()

    const response = await client.get('/admin/orders').withInertia().loginAs(staff)

    response.assertRedirectsTo('/staff/trips')
  })
})
