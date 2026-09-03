import { test } from '@japa/runner'
import AdminChannelPolicy from '#policies/admin_channel_policy'
import OrderPolicy from '#policies/order_policy'
import type User from '#models/user'
import { Bouncer } from '@adonisjs/bouncer'
import testUtils from '@adonisjs/core/services/test_utils'
import { UserFactory } from '#database/factories/user_factory'
import { createCustomer, createOrder } from '#tests/utils/helpers'

function bouncerFor(user: User | null) {
  return new Bouncer(user as User)
}

function canSubscribeToAdminFeed(user: User | null): Promise<boolean> {
  return bouncerFor(user).with(AdminChannelPolicy).allows('subscribe')
}

function canSubscribeToOrder(user: User | null, orderNumber: string): Promise<boolean> {
  return bouncerFor(user).with(OrderPolicy).allows('subscribe', orderNumber)
}

test.group('Channel access | the shop-wide admin feed', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  test('an admin may listen in', async ({ assert }) => {
    const admin = await UserFactory.apply('admin').create()

    assert.isTrue(await canSubscribeToAdminFeed(admin))
  })

  test('a customer may not listen in', async ({ assert }) => {
    const customer = await UserFactory.create()

    assert.isFalse(await canSubscribeToAdminFeed(customer))
  })

  test('a staff member may not listen in', async ({ assert }) => {
    const staff = await UserFactory.apply('staff').create()

    assert.isFalse(await canSubscribeToAdminFeed(staff))
  })

  test('a signed out visitor may not listen in', async ({ assert }) => {
    assert.isFalse(await canSubscribeToAdminFeed(null))
  })
})

test.group('Channel access | a single order', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  test('the customer who placed the order may follow it', async ({ assert }) => {
    const customer = await createCustomer()
    const order = await createOrder(customer)

    assert.isTrue(await canSubscribeToOrder(customer.user, order.orderNumber))
  })

  test('another customer may not follow it', async ({ assert }) => {
    const customer = await createCustomer()
    const stranger = await createCustomer()
    const order = await createOrder(customer)

    assert.isFalse(await canSubscribeToOrder(stranger.user, order.orderNumber))
  })

  test('staff may follow any order', async ({ assert }) => {
    const customer = await createCustomer()
    const order = await createOrder(customer)
    const staff = await UserFactory.apply('staff').create()

    assert.isTrue(await canSubscribeToOrder(staff, order.orderNumber))
  })

  test('an admin may follow any order', async ({ assert }) => {
    const customer = await createCustomer()
    const order = await createOrder(customer)
    const admin = await UserFactory.apply('admin').create()

    assert.isTrue(await canSubscribeToOrder(admin, order.orderNumber))
  })

  test('a signed out visitor may not follow an order', async ({ assert }) => {
    const customer = await createCustomer()
    const order = await createOrder(customer)

    assert.isFalse(await canSubscribeToOrder(null, order.orderNumber))
  })

  test('an order that does not exist is not a way in', async ({ assert }) => {
    const customer = await createCustomer()

    assert.isFalse(await canSubscribeToOrder(customer.user, 'ORD9999-9999'))
  })
})
