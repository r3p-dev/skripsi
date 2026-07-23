import { test } from '@japa/runner'
import testUtils from '@adonisjs/core/services/test_utils'
import { UserFactory } from '#database/factories/user_factory'

test.group('GET Pages', (group) => {
  group.each.setup(() => {
    return testUtils.db().truncate()
  })

  test('GET /orders/create returns customer/order/create', async ({ client }) => {
    const user = await UserFactory.create()

    const response = await client.visit('customer.order.create').loginAs(user).withInertia()

    response.assertInertiaComponent('customer/order/create')
  })

  test('GET /orders returns customer/order/index', async ({ client, db }) => {
    const user = await UserFactory.with('addresses').with('orders', 10).create()

    const response = await client.visit('customer.order.index').loginAs(user).withInertia()

    response.assertInertiaComponent('customer/order/index')
    await db.assertHas('orders', { user_id: user.id }, 10)
  })

  test('GET /orders/:number returns customer/order/show', async ({ client }) => {
    const user = await UserFactory.with('addresses').with('orders', 10).create()
    const order = user.orders[0]

    const response = await client
      .visit('customer.order.show', { number: order.orderNumber })
      .loginAs(user)
      .withInertia()

    response.assertInertiaComponent('customer/order/show')
  })
})
