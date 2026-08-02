import { UserFactory } from '#database/factories/user_factory'
import { OrderStatus } from '#enums/order_status_enum'
import { OrderFactory } from '#database/factories/order_factory'
import { AddressFactory } from '#database/factories/address_factory'
import Order from '#models/order'
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

    const orderNumbers = response.inertiaProps.trips.map(
      (item: { orderNumber: string }) => item.orderNumber
    )
    assert.includeMembers(orderNumbers, [pickupOrder.orderNumber, deliveryOrder.orderNumber])
  })

  /**
   * The whole reason claiming a task exists. The board is on the screen of
   * everyone on shift whether or not they take the job, so it carries an order
   * number, a badge and a distance and nothing else — a customer's name, phone
   * number and front door are not a browsing list. They arrive with the task
   * once somebody claims it, at which point the claim is on the record under
   * their name.
   */
  test('the queue does not publish customer details to everyone on shift', async ({
    client,
    assert,
  }) => {
    const staff = await UserFactory.apply('staff').merge({ phone: '081200000050' }).create()
    const customer = await UserFactory.merge({ phone: '081200000051' }).create()
    const address = await AddressFactory.merge({
      userId: customer.id,
      isActive: true,
      name: 'Rahasia Pelanggan',
      street: 'Jalan Rahasia 42',
    }).create()

    await OrderFactory.merge({
      userId: customer.id,
      addressId: address.id,
      pickupDate: DateTime.now(),
    }).create()

    const response = await client.get('/staff/trips').withInertia().loginAs(staff)

    const [stop] = response.inertiaProps.trips

    assert.deepEqual(Object.keys(stop).sort(), [
      'distanceKm',
      'id',
      'orderNumber',
      'pickupDate',
      'status',
      'type',
    ])
    assert.notInclude(JSON.stringify(response.inertiaProps.trips), 'Rahasia Pelanggan')
    assert.notInclude(JSON.stringify(response.inertiaProps.trips), 'Jalan Rahasia 42')
  })

  /**
   * A staff member who claims a stop and then loses signal, goes home, or
   * simply forgets would otherwise keep that order out of everyone else's
   * queue forever, and the only way back would be an admin editing rows.
   */
  test('a claim that has run out puts the stop back in the queue', async ({ client, assert }) => {
    const holder = await UserFactory.apply('staff').merge({ phone: '081200000060' }).create()
    const other = await UserFactory.apply('staff').merge({ phone: '081200000061' }).create()
    const customer = await UserFactory.merge({ phone: '081200000062' }).create()
    const address = await AddressFactory.merge({ userId: customer.id, isActive: true }).create()

    const lapsed = await OrderFactory.merge({
      userId: customer.id,
      addressId: address.id,
      pickupDate: DateTime.now(),
      lockedById: holder.id,
      lockedTask: 'pickup',
      lockedUntil: DateTime.now().minus({ minutes: 1 }),
    }).create()

    const response = await client.get('/staff/trips').withInertia().loginAs(other)

    const orderNumbers = response.inertiaProps.trips.map(
      (item: { orderNumber: string }) => item.orderNumber
    )
    assert.include(orderNumbers, lapsed.orderNumber)
  })

  test('a claim that is still running keeps the stop out of the queue', async ({
    client,
    assert,
  }) => {
    const holder = await UserFactory.apply('staff').merge({ phone: '081200000070' }).create()
    const other = await UserFactory.apply('staff').merge({ phone: '081200000071' }).create()
    const customer = await UserFactory.merge({ phone: '081200000072' }).create()
    const address = await AddressFactory.merge({ userId: customer.id, isActive: true }).create()

    const held = await OrderFactory.merge({
      userId: customer.id,
      addressId: address.id,
      pickupDate: DateTime.now(),
      lockedById: holder.id,
      lockedTask: 'pickup',
      lockedUntil: DateTime.now().plus({ hours: 2 }),
    }).create()

    const response = await client.get('/staff/trips').withInertia().loginAs(other)

    const orderNumbers = response.inertiaProps.trips.map(
      (item: { orderNumber: string }) => item.orderNumber
    )
    assert.notInclude(orderNumbers, held.orderNumber)
  })

  test('GET /staff/trips mixes overdue orders into the same queue', async ({ client, assert }) => {
    const staff = await UserFactory.apply('staff').merge({ phone: '081200000003' }).create()
    const customer = await UserFactory.merge({ phone: '081200000004' }).create()
    const address = await AddressFactory.merge({ userId: customer.id, isActive: true }).create()

    const missedOrder = await OrderFactory.merge({
      userId: customer.id,
      addressId: address.id,
      pickupDate: DateTime.now().minus({ days: 2 }),
    }).create()

    const response = await client.get('/staff/trips').withInertia().loginAs(staff)

    const orderNumbers = response.inertiaProps.trips.map(
      (item: { orderNumber: string }) => item.orderNumber
    )
    assert.include(orderNumbers, missedOrder.orderNumber)
  })

  test('GET /staff/trips orders the queue nearest to the shop first', async ({
    client,
    assert,
  }) => {
    const staff = await UserFactory.apply('staff').merge({ phone: '081200000030' }).create()
    const customer = await UserFactory.merge({ phone: '081200000031' }).create()

    // Both a few kilometres out of the shop, one roughly ten times further away.
    const nearAddress = await AddressFactory.merge({
      userId: customer.id,
      isActive: true,
      latitude: -6.95,
      longitude: 107.66,
    }).create()

    const farAddress = await AddressFactory.merge({
      userId: customer.id,
      isActive: false,
      latitude: -6.9,
      longitude: 107.75,
    }).create()

    const farOrder = await OrderFactory.merge({
      userId: customer.id,
      addressId: farAddress.id,
      pickupDate: DateTime.now(),
    }).create()

    const nearOrder = await OrderFactory.merge({
      userId: customer.id,
      addressId: nearAddress.id,
      pickupDate: DateTime.now(),
    }).create()

    const response = await client.get('/staff/trips').withInertia().loginAs(staff)

    const orderNumbers = response.inertiaProps.trips.map(
      (item: { orderNumber: string }) => item.orderNumber
    )
    assert.deepEqual(orderNumbers, [nearOrder.orderNumber, farOrder.orderNumber])
  })

  test('GET /staff/trips hides tasks another staff member is holding', async ({
    client,
    assert,
  }) => {
    const staffA = await UserFactory.apply('staff').merge({ phone: '081200000011' }).create()
    const staffB = await UserFactory.apply('staff').merge({ phone: '081200000012' }).create()
    const customer = await UserFactory.merge({ phone: '081200000013' }).create()
    const address = await AddressFactory.merge({ userId: customer.id, isActive: true }).create()

    const claimedOrder = await OrderFactory.merge({
      userId: customer.id,
      addressId: address.id,
      pickupDate: DateTime.now(),
    }).create()

    await client.get(`/staff/trips/${claimedOrder.orderNumber}/pickup`).loginAs(staffA)

    const response = await client.get('/staff/trips').withInertia().loginAs(staffB)

    const orderNumbers = response.inertiaProps.trips.map(
      (item: { orderNumber: string }) => item.orderNumber
    )
    assert.notInclude(orderNumbers, claimedOrder.orderNumber)
  })

  test('a staff member holding a task is sent back to it instead of the queue', async ({
    client,
  }) => {
    const staff = await UserFactory.apply('staff').merge({ phone: '081200000014' }).create()
    const order = await OrderFactory.create()

    await client.get(`/staff/trips/${order.orderNumber}/pickup`).loginAs(staff)

    const response = await client.get('/staff/trips').loginAs(staff)

    response.assertRedirectsTo(`/staff/trips/${order.orderNumber}/pickup`)
  })
})

test.group('Staff Cleaning', (group) => {
  group.each.setup(() => testUtils.db().truncate())

  test('marking cleaning done sends an order with an address to delivery', async ({
    client,
    assert,
  }) => {
    const staff = await UserFactory.apply('staff').create()
    const customer = await UserFactory.merge({ phone: '081200000015' }).create()
    const address = await AddressFactory.merge({ userId: customer.id, isActive: true }).create()

    const order = await OrderFactory.apply('inCleaning')
      .merge({ userId: customer.id, addressId: address.id })
      .create()

    const response = await client
      .put(`/staff/cleanings/${order.orderNumber}`)
      .loginAs(staff)
      .file('photo', photoPath)
      .withCsrfToken()

    response.assertRedirectsTo('/staff/trips')

    await order.refresh()
    assert.equal(order.status, 'in_delivery')

    // The "after" half of the before/after pair the customer is shown.
    const action = await OrderAction.query()
      .where('orderId', order.id)
      .where('name', 'cleaning_done')
      .firstOrFail()
    assert.isNotNull(action.photoPath)
  })

  /**
   * A walk-in has nowhere to be delivered to, so washing it does not finish
   * it — it puts it on the shelf. The order is not done until somebody
   * actually walks out with it, which is a separate step at the counter.
   */
  test('marking cleaning done leaves a walk-in order waiting to be collected', async ({
    client,
    assert,
  }) => {
    const staff = await UserFactory.apply('staff').create()

    const order = await OrderFactory.apply('inCleaning')
      .merge({ userId: null, addressId: null })
      .create()

    await client
      .put(`/staff/cleanings/${order.orderNumber}`)
      .loginAs(staff)
      .file('photo', photoPath)
      .withCsrfToken()

    await order.refresh()
    assert.equal(order.status, OrderStatus.CLEANING_DONE)
  })

  test('a collected walk-in order is finished at the counter', async ({ client, assert }) => {
    const staff = await UserFactory.apply('staff').merge({ phone: '081200000031' }).create()

    const order = await OrderFactory.merge({
      userId: null,
      addressId: null,
      status: OrderStatus.CLEANING_DONE,
    }).create()

    const response = await client
      .put(`/staff/collections/${order.orderNumber}`)
      .loginAs(staff)
      .withCsrfToken()

    response.assertRedirectsTo('/staff/trips')

    await order.refresh()
    assert.equal(order.status, OrderStatus.COMPLETED)
  })

  test('a batch cannot be marked washed without an after photo', async ({ client, assert }) => {
    const staff = await UserFactory.apply('staff').merge({ phone: '081200000021' }).create()
    const order = await OrderFactory.apply('inCleaning').create()

    const response = await client
      .put(`/staff/cleanings/${order.orderNumber}`)
      .withInertia()
      .loginAs(staff)
      .header('referer', '/staff/trips')
      .withCsrfToken()

    response.assertInertiaPropsContains({ errors: { photo: 'Foto wajib diisi' } })

    await order.refresh()
    assert.equal(order.status, 'in_cleaning')
  })

  test('the cleaning queue lists the longest-waiting batch first', async ({ client, assert }) => {
    const staff = await UserFactory.apply('staff').merge({ phone: '081200000018' }).create()

    const newerBatch = await OrderFactory.apply('inCleaning').create()
    const olderBatch = await OrderFactory.apply('inCleaning').create()

    // Created second but waiting the longest, so ordering cannot come from the id.
    await Order.query()
      .where('id', olderBatch.id)
      .update({ created_at: DateTime.now().minus({ days: 2 }).toSQL() })

    const response = await client.get('/staff/trips').withInertia().loginAs(staff)

    const orderNumbers = response.inertiaProps.cleanings.map(
      (order: { orderNumber: string }) => order.orderNumber
    )
    assert.deepEqual(orderNumbers, [olderBatch.orderNumber, newerBatch.orderNumber])
  })

  test('a batch that is no longer in cleaning cannot be marked washed again', async ({
    client,
    assert,
  }) => {
    const staff = await UserFactory.apply('staff').merge({ phone: '081200000019' }).create()
    const customer = await UserFactory.merge({ phone: '081200000020' }).create()
    const address = await AddressFactory.merge({ userId: customer.id, isActive: true }).create()

    const order = await OrderFactory.apply('inCleaning')
      .merge({ userId: customer.id, addressId: address.id })
      .create()

    await client
      .put(`/staff/cleanings/${order.orderNumber}`)
      .loginAs(staff)
      .file('photo', photoPath)
      .withCsrfToken()

    // Two staff working the same batch both press the button; the second press
    // finds nothing left in cleaning, which is harmless rather than a double move.
    const response = await client
      .put(`/staff/cleanings/${order.orderNumber}`)
      .loginAs(staff)
      .file('photo', photoPath)
      .withCsrfToken()

    response.assertStatus(404)

    await order.refresh()
    assert.equal(order.status, 'in_delivery')

    const actions = await OrderAction.query()
      .where('orderId', order.id)
      .where('name', 'cleaning_done')
    assert.lengthOf(actions, 1)
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
