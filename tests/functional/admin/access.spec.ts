import { UserFactory } from '#database/factories/user_factory'
import testUtils from '@adonisjs/core/services/test_utils'
import { test } from '@japa/runner'

/**
 * The permission boundary around an administrator account.
 *
 * An admin sees the whole shop, and is the only role that does. Notably they
 * are still turned away from the staff and customer screens: those are other
 * people's workflows, with their own claim locks and their own order history,
 * and an admin wandering into them would take tasks out of the field team's
 * queue.
 */
test.group('Admin access', (group) => {
  group.each.setup(() => testUtils.db().truncate())

  const allowed = [
    '/admin/dashboard',
    '/admin/orders',
    '/admin/services',
    '/admin/services/create',
    '/admin/users',
    '/admin/users/create',
    '/admin/signup',
    '/admin/reports',
    '/admin/reconciliations',
    '/admin/profile',
  ]

  for (const path of allowed) {
    test(`an admin may open ${path}`, async ({ client }) => {
      const admin = await UserFactory.apply('admin').create()

      const response = await client.get(path).withInertia().loginAs(admin)

      response.assertStatus(200)
    })
  }

  const denied = ['/order', '/orders', '/profile', '/address', '/staff/trips', '/staff/customers']

  for (const path of denied) {
    test(`an admin is turned away from ${path}`, async ({ client }) => {
      const admin = await UserFactory.apply('admin').create()

      const response = await client.get(path).withInertia().loginAs(admin)

      response.assertRedirectsTo('/admin/dashboard')
    })
  }

  /**
   * Staff and admin accounts have no public route into existence — the point
   * of the sign-up form living inside the admin area at all. Every other role
   * is covered by the "denied" lists in their own access spec.
   */
  test('the staff sign-up form only offers privileged roles', async ({ client }) => {
    const admin = await UserFactory.apply('admin').create()

    const response = await client.get('/admin/signup').withInertia().loginAs(admin)

    response.assertInertiaPropsContains({
      roleOptions: [
        { value: 'staff', label: 'Petugas' },
        { value: 'admin', label: 'Admin' },
      ],
    })
  })
})
