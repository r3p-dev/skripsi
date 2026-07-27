import { UserFactory } from '#database/factories/user_factory'
import { OrderFactory } from '#database/factories/order_factory'
import OrderItem from '#models/order_item'
import Service from '#models/service'
import { ServiceCategory, ServiceType } from '#enums/service_enum'
import testUtils from '@adonisjs/core/services/test_utils'
import { test } from '@japa/runner'
import { fileURLToPath } from 'node:url'

const photoPath = fileURLToPath(new URL('../../fixtures/photo.png', import.meta.url))

function createMainService() {
  return Service.create({
    name: 'Cuci Sepatu Reguler',
    description: 'Cuci sepatu standar',
    category: ServiceCategory.SHOE_WASH,
    type: ServiceType.REGULAR,
    price: 30000,
  })
}

function createAdditionalService() {
  return Service.create({
    name: 'Deodorizer',
    description: 'Layanan tambahan anti bau',
    category: ServiceCategory.ADDITIONAL,
    type: ServiceType.ADDITIONAL,
    price: 10000,
  })
}

test.group('Staff Inspection', (group) => {
  group.each.setup(() => testUtils.db().truncate())

  test('GET /staff/inspections/:number claims the task and lists available services', async ({
    client,
    assert,
  }) => {
    const staff = await UserFactory.apply('staff').create()
    const order = await OrderFactory.apply('inInspection').create()
    const service = await createMainService()

    const response = await client
      .get(`/staff/inspections/${order.orderNumber}`)
      .withInertia()
      .loginAs(staff)

    response.assertInertiaPropsContains({ blocked: false })
    assert.isTrue(
      response.inertiaProps.services.some((item: { id: number }) => item.id === service.id)
    )
  })

  test('a second staff is blocked from an already claimed inspection', async ({ client }) => {
    const staffA = await UserFactory.apply('staff').merge({ phone: '081200000101' }).create()
    const staffB = await UserFactory.apply('staff').merge({ phone: '081200000102' }).create()
    const order = await OrderFactory.apply('inInspection').create()

    await client.get(`/staff/inspections/${order.orderNumber}`).loginAs(staffA)

    const response = await client
      .get(`/staff/inspections/${order.orderNumber}`)
      .withInertia()
      .loginAs(staffB)

    response.assertInertiaPropsContains({ blocked: true })
  })

  test('completing an inspection creates items and moves the order to awaiting payment', async ({
    client,
    assert,
  }) => {
    const staff = await UserFactory.apply('staff').create()
    const order = await OrderFactory.apply('inInspection').create()
    const mainService = await createMainService()
    const additionalService = await createAdditionalService()

    await client.get(`/staff/inspections/${order.orderNumber}`).loginAs(staff)

    const response = await client
      .put(`/staff/inspections/${order.orderNumber}`)
      .loginAs(staff)
      .field('items[0][brand]', 'Nike')
      .field('items[0][model]', 'Air Max')
      .field('items[0][material]', 'Kanvas')
      .field('items[0][size]', '42')
      .field('items[0][condition]', 'Kotor ringan')
      .field('items[0][type]', 'shoe')
      .field('items[0][service]', String(mainService.id))
      .field('items[0][additionalServices][]', String(additionalService.id))
      .file('photo', photoPath)
      .withCsrfToken()

    response.assertRedirectsTo('/staff/trips')

    await order.refresh()
    assert.equal(order.status, 'awaiting_payment')
    assert.equal(Number(order.totalPrice), 40000)

    const items = await OrderItem.query().where('orderId', order.id)
    assert.lengthOf(items, 2)
  })

  test('completing an inspection with two items persists each item type correctly', async ({
    client,
    assert,
  }) => {
    const staff = await UserFactory.apply('staff').create()
    const order = await OrderFactory.apply('inInspection').create()
    const mainService = await createMainService()
    const bagService = await Service.create({
      name: 'Cuci Tas Reguler',
      description: 'Cuci tas standar',
      category: ServiceCategory.BAG_WASH,
      type: ServiceType.REGULAR,
      price: 25000,
    })

    await client.get(`/staff/inspections/${order.orderNumber}`).loginAs(staff)

    await client
      .put(`/staff/inspections/${order.orderNumber}`)
      .loginAs(staff)
      .field('items[0][brand]', 'Nike')
      .field('items[0][model]', 'Air Max')
      .field('items[0][material]', 'Kanvas')
      .field('items[0][size]', '42')
      .field('items[0][condition]', 'Kotor ringan')
      .field('items[0][type]', 'shoe')
      .field('items[0][service]', String(mainService.id))
      .field('items[1][brand]', 'Eiger')
      .field('items[1][model]', 'Backpack')
      .field('items[1][material]', 'Nylon')
      .field('items[1][size]', 'M')
      .field('items[1][condition]', 'Kotor berat')
      .field('items[1][type]', 'bag')
      .field('items[1][service]', String(bagService.id))
      .file('photo', photoPath)
      .withCsrfToken()

    const items = await OrderItem.query()
      .where('orderId', order.id)
      .preload('item')
      .orderBy('id', 'asc')

    assert.lengthOf(items, 2)
    assert.equal(items[0].item.type, 'shoe')
    assert.equal(items[1].item.type, 'bag')
  })
})
