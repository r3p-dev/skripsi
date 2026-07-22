import { test } from '@japa/runner'
import testUtils from '@adonisjs/core/services/test_utils'
import { createAddress, createOrder, createUser } from '#tests/utils/helpers'

test.group('GET Pages', (group) => {
  group.each.setup(() => {
    return testUtils.db().truncate()
  })

  test('GET /orders/create returns customer/order/create', async ({ client }) => {
    const user = await createUser()

    const response = await client.visit('customer.order.create').loginAs(user).withInertia()

    response.assertInertiaComponent('customer/order/create')
  })

  test('GET /orders returns customer/order/index', async ({ client }) => {
    const user = await createUser()

    const response = await client.visit('customer.order.index').loginAs(user).withInertia()

    response.assertInertiaComponent('customer/order/index')
  })

  test('GET /orders/:number returns customer/order/show', async ({ client }) => {
    const user = await createUser()
    const address = await createAddress(user.id)
    const order = await createOrder(user, address.id)

    const response = await client
      .visit('customer.order.show', { number: order.orderNumber })
      .loginAs(user)
      .withInertia()

    response.assertInertiaComponent('customer/order/show')
  })
})
