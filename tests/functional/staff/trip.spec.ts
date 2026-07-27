import { UserFactory } from '#database/factories/user_factory'
import { OrderFactory } from '#database/factories/order_factory'
import { AddressFactory } from '#database/factories/address_factory'
import OrderAction from '#models/order_action'
import testUtils from '@adonisjs/core/services/test_utils'
import { test } from '@japa/runner'
import { fileURLToPath } from 'node:url'
import { DateTime } from 'luxon'

const photoPath = fileURLToPath(new URL('../../fixtures/photo.png', import.meta.url))

test.group('Staff Trip Queue', (group) => {
  group.each.setup(() => testUtils.db().truncate())

  test('GET /staff/trips lists today pickup and delivery orders', async ({ client, assert }) => {
    const staff = await UserFactory.apply('staff').merge({ phone: '081200000001' }).create()
    const customer = await UserFactory.merge({ phone: '081200000002' }).create()
    const address = await AddressFactory.merge({ userId: customer.id, isActive: true }).create()

    const pickupOrder = await OrderFactory.merge({
      userId: customer.id,
      addressId: address.id,
      pickupDate: DateTime.now(),
    }).create()

    const deliveryOrder = await OrderFactory.apply('inDelivery')
      .merge({ userId: customer.id, addressId: address.id, pickupDate: DateTime.now() })
      .create()

    const response = await client.get('/staff/trips').withInertia().loginAs(staff)

    response.assertInertiaComponent('staff/trip/index')

    const orderNumbers = response.inertiaProps.today.map(
      (item: { orderNumber: string }) => item.orderNumber
    )
    assert.includeMembers(orderNumbers, [pickupOrder.orderNumber, deliveryOrder.orderNumber])
  })

  test('GET /staff/trips lists orders missed for today under the overdue group', async ({
    client,
    assert,
  }) => {
    const staff = await UserFactory.apply('staff').merge({ phone: '081200000003' }).create()
    const customer = await UserFactory.merge({ phone: '081200000004' }).create()
    const address = await AddressFactory.merge({ userId: customer.id, isActive: true }).create()

    const missedOrder = await OrderFactory.merge({
      userId: customer.id,
      addressId: address.id,
      pickupDate: DateTime.now().minus({ days: 2 }),
    }).create()

    const response = await client.get('/staff/trips').withInertia().loginAs(staff)

    const missedOrderNumbers = response.inertiaProps.missed.map(
      (item: { orderNumber: string }) => item.orderNumber
    )
    assert.include(missedOrderNumbers, missedOrder.orderNumber)
  })
})

test.group('Staff Trip Lock', (group) => {
  group.each.setup(() => testUtils.db().truncate())

  test('opening a pickup task claims it for the visiting staff', async ({ client, assert }) => {
    const staff = await UserFactory.apply('staff').create()
    const order = await OrderFactory.create()

    const response = await client
      .get(`/staff/trips/${order.orderNumber}/pickup`)
      .withInertia()
      .loginAs(staff)

    response.assertInertiaPropsContains({ blocked: false })

    const action = await OrderAction.query().where('orderId', order.id).firstOrFail()
    assert.equal(action.name, 'attempt_pickup')
    assert.equal(action.staffId, staff.id)
  })

  test('a second staff is blocked from a task already claimed', async ({ client }) => {
    const staffA = await UserFactory.apply('staff').merge({ phone: '081200000005' }).create()
    const staffB = await UserFactory.apply('staff').merge({ phone: '081200000006' }).create()
    const order = await OrderFactory.create()

    await client.get(`/staff/trips/${order.orderNumber}/pickup`).loginAs(staffA)

    const response = await client
      .get(`/staff/trips/${order.orderNumber}/pickup`)
      .withInertia()
      .loginAs(staffB)

    response.assertInertiaPropsContains({ blocked: true })
  })

  test('releasing a task lets another staff claim it', async ({ client }) => {
    const staffA = await UserFactory.apply('staff').merge({ phone: '081200000007' }).create()
    const staffB = await UserFactory.apply('staff').merge({ phone: '081200000008' }).create()
    const order = await OrderFactory.create()

    await client.get(`/staff/trips/${order.orderNumber}/pickup`).loginAs(staffA)

    await client
      .delete(`/staff/trips/${order.orderNumber}/pickup`)
      .loginAs(staffA)
      .header('referer', `/staff/trips/${order.orderNumber}/pickup`)
      .withCsrfToken()

    const response = await client
      .get(`/staff/trips/${order.orderNumber}/pickup`)
      .withInertia()
      .loginAs(staffB)

    response.assertInertiaPropsContains({ blocked: false })
  })

  test('cannot complete a task without holding its lock', async ({ client }) => {
    const staffA = await UserFactory.apply('staff').merge({ phone: '081200000009' }).create()
    const staffB = await UserFactory.apply('staff').merge({ phone: '081200000010' }).create()
    const order = await OrderFactory.create()

    await client.get(`/staff/trips/${order.orderNumber}/pickup`).loginAs(staffA)

    const response = await client
      .put(`/staff/trips/${order.orderNumber}/pickup`)
      .withInertia()
      .loginAs(staffB)
      .header('referer', `/staff/trips/${order.orderNumber}/pickup`)
      .file('photo', photoPath)
      .withCsrfToken()

    response.assertInertiaPropsContains({
      errors: { status: 'Anda tidak sedang memproses tugas ini.' },
    })
  })
})

test.group('Staff Trip Completion', (group) => {
  group.each.setup(() => testUtils.db().truncate())

  test('completing a pickup with a photo advances the order to inspection', async ({
    client,
    assert,
  }) => {
    const staff = await UserFactory.apply('staff').create()
    const order = await OrderFactory.create()

    await client.get(`/staff/trips/${order.orderNumber}/pickup`).loginAs(staff)

    const response = await client
      .put(`/staff/trips/${order.orderNumber}/pickup`)
      .loginAs(staff)
      .file('photo', photoPath)
      .withCsrfToken()

    response.assertRedirectsTo('/staff/trips')

    await order.refresh()
    assert.equal(order.status, 'in_inspection')

    const action = await OrderAction.query()
      .where('orderId', order.id)
      .where('name', 'pickup')
      .firstOrFail()
    assert.isNotNull(action.photoPath)
  })

  test('completing a delivery with a photo marks the order completed', async ({
    client,
    assert,
  }) => {
    const staff = await UserFactory.apply('staff').create()
    const order = await OrderFactory.apply('inDelivery').create()

    await client.get(`/staff/trips/${order.orderNumber}/delivery`).loginAs(staff)

    const response = await client
      .put(`/staff/trips/${order.orderNumber}/delivery`)
      .loginAs(staff)
      .file('photo', photoPath)
      .withCsrfToken()

    response.assertRedirectsTo('/staff/trips')

    await order.refresh()
    assert.equal(order.status, 'completed')
  })

  test('a photo is required to complete a pickup', async ({ client }) => {
    const staff = await UserFactory.apply('staff').create()
    const order = await OrderFactory.create()

    await client.get(`/staff/trips/${order.orderNumber}/pickup`).loginAs(staff)

    const response = await client
      .put(`/staff/trips/${order.orderNumber}/pickup`)
      .withInertia()
      .loginAs(staff)
      .header('referer', `/staff/trips/${order.orderNumber}/pickup`)
      .withCsrfToken()

    response.assertInertiaPropsContains({
      errors: { photo: 'Foto wajib diisi' },
    })
  })
})
