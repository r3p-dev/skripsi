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

test.group('Validation Errors', (group) => {
  group.each.setup(() => {
    return testUtils.db().truncate()
  })

  test('POST /orders returns validation errors for invalid pickup date', async ({ client }) => {
    const user = await UserFactory.with('addresses').create()

    const response = await client
      .post('/orders')
      .withInertia()
      .header('referer', '/orders/create')
      .json({
        addressId: user.addresses[0].id,
        pickupDate: 'null',
      })
      .loginAs(user)
      .withCsrfToken()

    response.assertInertiaPropsContains({
      errors: {
        pickupDate: 'Tanggal penjemputan harus berupa tanggal yang valid',
      },
      flash: {},
    })
  })

  test('POST /orders returns validation errors for missing addressId', async ({ client }) => {
    const user = await UserFactory.with('addresses').create()

    const response = await client
      .post('/orders')
      .withInertia()
      .header('referer', '/orders/create')
      .json({
        addressId: 'null',
        pickupDate: '2023-01-01',
      })
      .loginAs(user)
      .withCsrfToken()

    response.assertInertiaPropsContains({
      errors: {
        addressId: 'addressId harus berupa angka',
      },
      flash: {},
    })
  })
})

test.group('POST Succeeds', (group) => {
  group.each.setup(() => {
    return testUtils.db().truncate()
  })

  test('POST /orders creates a new order', async ({ client, db }) => {
    const user = await UserFactory.with('addresses').create()

    const response = await client
      .post('/orders')
      .withInertia()
      .header('referer', '/orders/create')
      .json({
        addressId: user.addresses[0].id,
        pickupDate: '2023-01-01',
      })
      .loginAs(user)
      .withCsrfToken()

    response.assertInertiaPropsContains({
      errors: {},
      flash: {
        success: 'Pesanan berhasil dibuat!',
      },
    })

    await db.assertHas('orders', {
      user_id: user.id,
      address_id: user.addresses[0].id,
      pickup_date: '2023-01-01',
    })
  })
})
