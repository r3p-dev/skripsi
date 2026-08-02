import { UserFactory } from '#database/factories/user_factory'
import testUtils from '@adonisjs/core/services/test_utils'
import { test } from '@japa/runner'

/**
 * The permission boundary around a customer account, stated as two lists:
 * what it opens, and what it is turned away from.
 */
test.group('Customer access', (group) => {
  group.each.setup(() => testUtils.db().truncate())

  const allowed = ['/order', '/orders', '/profile', '/address', '/address/create']

  for (const path of allowed) {
    test(`a customer may open ${path}`, async ({ client }) => {
      const customer = await UserFactory.create()

      const response = await client.get(path).withInertia().loginAs(customer)

      response.assertStatus(200)
    })
  }

  /**
   * Refused rather than 404'd, and sent somewhere useful rather than to a dead
   * end: a customer who lands on a staff URL by following a stale link should
   * end up on their own home screen knowing why.
   */
  const denied = [
    '/staff/trips',
    '/staff/orders/create',
    '/staff/customers',
    '/admin/dashboard',
    '/admin/users',
    '/admin/signup',
    '/admin/reports',
    '/admin/reconciliations',
  ]

  for (const path of denied) {
    test(`a customer is turned away from ${path}`, async ({ client }) => {
      const customer = await UserFactory.create()

      const response = await client.get(path).withInertia().loginAs(customer)

      response.assertRedirectsTo('/order')
    })
  }

  test('being turned away says why', async ({ client }) => {
    const customer = await UserFactory.create()

    const response = await client.get('/staff/trips').withInertia().loginAs(customer)

    response.assertInertiaPropsContains({
      flash: { error: 'Anda tidak memiliki akses ke halaman ini' },
    })
  })
})
