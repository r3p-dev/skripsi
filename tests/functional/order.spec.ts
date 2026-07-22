import { test } from '@japa/runner'
import testUtils from '@adonisjs/core/services/test_utils'
import { createUser } from '#tests/utils/helpers'

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

  test('GET /orders returns customer/order/show', async ({ client }) => {
    const user = await createUser()

    const response = await client
      .visit('customer.order.show', { number: 1 })
      .loginAs(user)
      .withInertia()

    response.assertInertiaComponent('customer/order/show')
  })
})
