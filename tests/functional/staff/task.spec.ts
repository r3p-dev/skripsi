import { test } from '@japa/runner'
import Order from '#models/order'
import testUtils from '@adonisjs/core/services/test_utils'
import { OrderStatus } from '#enums/order_enum'
import { TaskType } from '#enums/task_enum'
import { UserFactory } from '#database/factories/user_factory'
import { createCustomer, createOrder } from '#tests/utils/helpers'

test.group('Staff tasks | the queue', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  test('a member of staff sees the task queue', async ({ client }) => {
    const staff = await UserFactory.apply('staff').create()

    const response = await client.get('/staff/tasks').loginAs(staff).withInertia()

    response.assertStatus(200)
    response.assertInertiaComponent('staff/trip/index')
    response.assertInertiaPropsContains({ trips: [], inspections: [] })
  })

  test('a pickup waiting to be collected shows up as a trip', async ({ client, assert }) => {
    const staff = await UserFactory.apply('staff').create()
    const customer = await createCustomer()
    const order = await createOrder(customer)

    const response = await client.get('/staff/tasks').loginAs(staff).withInertia()

    const trips = response.inertiaProps.trips as {
      orderNumber: string
      type: string
      distanceKm: number
    }[]

    const trip = trips.find((entry) => entry.orderNumber === order.orderNumber)

    assert.isDefined(trip)
    assert.equal(trip?.type, TaskType.PICKUP)
    assert.isNumber(trip?.distanceKm)
  })

  test('a customer cannot reach the queue', async ({ client }) => {
    const customer = await UserFactory.create()

    const response = await client.get('/staff/tasks').loginAs(customer).redirects(0)

    response.assertStatus(302)
    response.assertHeader('location', '/profile')
  })

  test('a guest is sent to sign in', async ({ client }) => {
    const response = await client.get('/staff/tasks').redirects(0)

    response.assertStatus(302)
    response.assertHeader('location', '/login')
  })
})

test.group('Staff tasks | taking a trip', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  test('opening a pickup claims it and reveals the address', async ({ client, assert }) => {
    const staff = await UserFactory.apply('staff').create()
    const customer = await createCustomer()
    const order = await createOrder(customer)

    const response = await client
      .get(`/staff/tasks/${order.orderNumber}/trip/pickup`)
      .loginAs(staff)
      .withInertia()

    response.assertStatus(200)
    response.assertInertiaComponent('staff/trip/show')
    response.assertInertiaPropsContains({ blocked: false, type: TaskType.PICKUP })

    const props = response.inertiaProps as { order: { address?: unknown } }
    assert.isDefined(props.order.address)

    await order.refresh()
    assert.equal(order.claimedBy, staff.id)
  })

  test('a trip held by somebody else is blocked and withholds the address', async ({
    client,
    assert,
  }) => {
    const [holder, other] = [
      await UserFactory.apply('staff').create(),
      await UserFactory.apply('staff').create(),
    ]
    const customer = await createCustomer()
    const order = await createOrder(customer)

    await client.get(`/staff/tasks/${order.orderNumber}/trip/pickup`).loginAs(holder).withInertia()

    const response = await client
      .get(`/staff/tasks/${order.orderNumber}/trip/pickup`)
      .loginAs(other)
      .withInertia()

    response.assertStatus(200)
    response.assertInertiaPropsContains({ blocked: true })

    const props = response.inertiaProps as { order: { address?: unknown } }
    assert.isUndefined(props.order.address)
  })

  test('an unknown trip type is rejected', async ({ client }) => {
    const staff = await UserFactory.apply('staff').create()
    const customer = await createCustomer()
    const order = await createOrder(customer)

    const response = await client
      .get(`/staff/tasks/${order.orderNumber}/trip/teleport`)
      .loginAs(staff)
      .withInertia()
      .redirects(0)

    response.assertStatus(302)
  })

  test('a claimed trip can be handed back', async ({ client, assert }) => {
    const staff = await UserFactory.apply('staff').create()
    const customer = await createCustomer()
    const order = await createOrder(customer)

    await client.get(`/staff/tasks/${order.orderNumber}/trip/pickup`).loginAs(staff).withInertia()

    const response = await client
      .delete(`/staff/tasks/${order.orderNumber}/trip/pickup`)
      .loginAs(staff)
      .withCsrfToken()
      .redirects(0)

    response.assertStatus(302)

    await order.refresh()
    assert.isNull(order.claimedBy)
  })
})

test.group('Staff tasks | closing out the shop work', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  test('a collected order is marked complete', async ({ client, assert }) => {
    const staff = await UserFactory.apply('staff').create()
    const customer = await createCustomer()
    const order = await createOrder(customer, {
      attributes: { status: OrderStatus.CLEANING_DONE },
    })

    const response = await client
      .post(`/staff/tasks/${order.orderNumber}/collection`)
      .loginAs(staff)
      .withCsrfToken()
      .redirects(0)

    response.assertStatus(302)

    const updated = await Order.findOrFail(order.id)
    assert.equal(updated.status, OrderStatus.COMPLETED)
  })

  test('a print label can be opened for an order being washed', async ({ client }) => {
    const staff = await UserFactory.apply('staff').create()
    const customer = await createCustomer()
    const order = await createOrder(customer, { states: ['inCleaning'] })

    const response = await client
      .get(`/staff/tasks/${order.orderNumber}/tag`)
      .loginAs(staff)
      .withInertia()

    response.assertStatus(200)
    response.assertInertiaComponent('staff/order/tag')
  })
})
