import { test } from '@japa/runner'
import Order from '#models/order'
import OrderAction from '#models/order_action'
import testUtils from '@adonisjs/core/services/test_utils'
import { ActionName } from '#enums/order_action_enum'
import { OrderStatus } from '#enums/order_enum'
import { TaskType } from '#enums/task_enum'
import { TASK_TAKEN_MESSAGE } from '#services/task_service'
import { UserFactory } from '#database/factories/user_factory'
import { PNG_PIXEL, createCustomer, createOrder, inputErrors } from '#tests/utils/helpers'

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

  test('opening a pickup does not take it', async ({ client, assert }) => {
    const staff = await UserFactory.apply('staff').create()
    const customer = await createCustomer()
    const order = await createOrder(customer)

    const response = await client
      .get(`/staff/tasks/${order.orderNumber}/trip/pickup`)
      .loginAs(staff)
      .withInertia()

    response.assertStatus(200)
    response.assertInertiaComponent('staff/trip/show')
    response.assertInertiaPropsContains({ claimed: false, type: TaskType.PICKUP })

    const props = response.inertiaProps as { order: { address?: unknown } }
    assert.isUndefined(props.order.address, 'the address waits until the task is taken')

    await order.refresh()
    assert.isNull(order.claimedBy)
  })

  test('taking the task on claims it and reveals the address', async ({ client, assert }) => {
    const staff = await UserFactory.apply('staff').create()
    const customer = await createCustomer()
    const order = await createOrder(customer)

    const claimed = await client
      .post(`/staff/tasks/${order.orderNumber}/trip/pickup/claim`)
      .loginAs(staff)
      .withCsrfToken()
      .redirects(0)

    claimed.assertStatus(302)
    claimed.assertHeader('location', `/staff/tasks/${order.orderNumber}/trip/pickup`)

    await order.refresh()
    assert.equal(order.claimedBy, staff.id)

    const response = await client
      .get(`/staff/tasks/${order.orderNumber}/trip/pickup`)
      .loginAs(staff)
      .withInertia()

    response.assertInertiaPropsContains({ claimed: true })

    const props = response.inertiaProps as { order: { address?: unknown } }
    assert.isDefined(props.order.address)
  })

  test('a trip somebody else holds sends you back to the queue', async ({ client, assert }) => {
    const [holder, other] = [
      await UserFactory.apply('staff').create(),
      await UserFactory.apply('staff').create(),
    ]
    const customer = await createCustomer()
    const order = await createOrder(customer)

    await client
      .post(`/staff/tasks/${order.orderNumber}/trip/pickup/claim`)
      .loginAs(holder)
      .withCsrfToken()
      .redirects(0)

    const response = await client
      .get(`/staff/tasks/${order.orderNumber}/trip/pickup`)
      .loginAs(other)
      .redirects(0)

    response.assertStatus(302)
    response.assertHeader('location', '/staff/tasks')
    response.assertFlashMessage('error', TASK_TAKEN_MESSAGE)

    await order.refresh()
    assert.equal(order.claimedBy, holder.id)
  })

  test('reaching for a trip somebody else holds is refused', async ({ client, assert }) => {
    const [holder, other] = [
      await UserFactory.apply('staff').create(),
      await UserFactory.apply('staff').create(),
    ]
    const customer = await createCustomer()
    const order = await createOrder(customer)

    await client
      .post(`/staff/tasks/${order.orderNumber}/trip/pickup/claim`)
      .loginAs(holder)
      .withCsrfToken()
      .redirects(0)

    const response = await client
      .post(`/staff/tasks/${order.orderNumber}/trip/pickup/claim`)
      .loginAs(other)
      .withCsrfToken()
      .redirects(0)

    response.assertStatus(302)
    response.assertHeader('location', '/staff/tasks')
    response.assertFlashMessage('error', TASK_TAKEN_MESSAGE)

    await order.refresh()
    assert.equal(order.claimedBy, holder.id)
  })

  test('an inspection somebody else holds sends you back to the queue', async ({ client }) => {
    const [holder, other] = [
      await UserFactory.apply('staff').create(),
      await UserFactory.apply('staff').create(),
    ]
    const customer = await createCustomer()
    const order = await createOrder(customer, { states: ['collected'] })

    await client
      .post(`/staff/tasks/${order.orderNumber}/inspection/claim`)
      .loginAs(holder)
      .withCsrfToken()
      .redirects(0)

    const response = await client
      .get(`/staff/tasks/${order.orderNumber}/inspection`)
      .loginAs(other)
      .redirects(0)

    response.assertStatus(302)
    response.assertHeader('location', '/staff/tasks')
    response.assertFlashMessage('error', TASK_TAKEN_MESSAGE)
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

    await client
      .post(`/staff/tasks/${order.orderNumber}/trip/pickup/claim`)
      .loginAs(staff)
      .withCsrfToken()
      .redirects(0)

    await order.refresh()
    assert.equal(order.claimedBy, staff.id)

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

  test('a collected order is marked complete with its handover photo', async ({
    client,
    assert,
  }) => {
    const staff = await UserFactory.apply('staff').create()
    const customer = await createCustomer()
    const order = await createOrder(customer, {
      attributes: { status: OrderStatus.CLEANING_DONE },
    })

    const response = await client
      .post(`/staff/tasks/${order.orderNumber}/collection`)
      .loginAs(staff)
      .withCsrfToken()
      .file('photo', PNG_PIXEL, { filename: 'serah-terima.png' })
      .redirects(0)

    response.assertStatus(302)

    const updated = await Order.findOrFail(order.id)
    assert.equal(updated.status, OrderStatus.COMPLETED)

    const action = await OrderAction.query()
      .where('order_id', order.id)
      .where('name', ActionName.COLLECTED)
      .firstOrFail()

    assert.equal(action.userId, staff.id)
    assert.isNotNull(action.photoPath)
  })

  test('a handover without a photo is refused', async ({ client, assert }) => {
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
    assert.property(inputErrors(response), 'photo')

    const updated = await Order.findOrFail(order.id)
    assert.equal(updated.status, OrderStatus.CLEANING_DONE)
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
