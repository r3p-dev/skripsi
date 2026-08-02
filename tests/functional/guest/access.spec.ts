import testUtils from '@adonisjs/core/services/test_utils'
import { test } from '@japa/runner'

/**
 * What somebody who is not signed in may reach.
 *
 * Split out per role on purpose. The boundary used to live in one file that
 * looped over roles, which reads fine until a rule diverges — and then the
 * loop grows a conditional, and the conditional grows a second one, and
 * nobody can tell from the file what any single role is actually allowed to
 * do. One file per role answers that by being read top to bottom.
 */
test.group('Guest access', (group) => {
  group.each.setup(() => testUtils.db().truncate())

  const publicRoutes = ['/', '/login', '/signup', '/forgot-password']

  for (const path of publicRoutes) {
    test(`a guest may open ${path}`, async ({ client }) => {
      const response = await client.get(path).withInertia()

      response.assertStatus(200)
    })
  }

  /**
   * One route from behind each role's door. Every one of them redirects to
   * the sign-in page rather than answering — including with a 404, which
   * would otherwise tell a stranger which order numbers exist.
   */
  const guardedRoutes = [
    '/order',
    '/orders',
    '/profile',
    '/address',
    '/staff/trips',
    '/staff/orders/create',
    '/admin/dashboard',
    '/admin/users',
    '/admin/signup',
    '/admin/reconciliations',
  ]

  for (const path of guardedRoutes) {
    test(`a guest is sent to sign in from ${path}`, async ({ client }) => {
      const response = await client.get(path).withInertia()

      response.assertRedirectsTo('/login')
    })
  }
})
