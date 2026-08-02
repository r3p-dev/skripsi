import { UserFactory } from '#database/factories/user_factory'
import testUtils from '@adonisjs/core/services/test_utils'
import { test } from '@japa/runner'

/**
 * The permission boundary around a staff account.
 *
 * Staff sit between the other two: they can see the shop's work but not its
 * money, and they have no customer-facing screens of their own.
 */
test.group('Staff access', (group) => {
  group.each.setup(() => testUtils.db().truncate())

  const allowed = ['/staff/trips', '/staff/orders/create', '/staff/profile', '/staff/customers']

  for (const path of allowed) {
    test(`staff may open ${path}`, async ({ client }) => {
      const staff = await UserFactory.apply('staff').create()

      const response = await client.get(path).withInertia().loginAs(staff)

      response.assertStatus(200)
    })
  }

  /**
   * The admin half of the app is where the takings, the price list and the
   * account register live. A staff member has no business in any of it, and
   * the customer screens are not theirs either — they have their own.
   */
  const denied = [
    '/order',
    '/orders',
    '/profile',
    '/address',
    '/admin/dashboard',
    '/admin/users',
    '/admin/signup',
    '/admin/reports',
    '/admin/reconciliations',
    '/admin/services',
  ]

  for (const path of denied) {
    test(`staff are turned away from ${path}`, async ({ client }) => {
      const staff = await UserFactory.apply('staff').create()

      const response = await client.get(path).withInertia().loginAs(staff)

      response.assertRedirectsTo('/staff/trips')
    })
  }

  /**
   * Deactivation is how somebody stops working here — their name stays on
   * every collection and delivery they recorded, so the account is switched
   * off rather than deleted. It has to take effect on the next request, not
   * whenever their session happens to lapse.
   */
  test('a deactivated staff account is signed out on its next request', async ({ client }) => {
    const staff = await UserFactory.apply('staff').merge({ isActive: false }).create()

    const response = await client.get('/staff/trips').withInertia().loginAs(staff)

    response.assertRedirectsTo('/login')
  })
})
