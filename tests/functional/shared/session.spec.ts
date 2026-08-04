import { UserFactory } from '#database/factories/user_factory'
import { Role } from '#enums/role_enum'
import testUtils from '@adonisjs/core/services/test_utils'
import { test } from '@japa/runner'
import { DateTime } from 'luxon'

/**
 * Session rules that hold whoever is signed in.
 *
 * These live in `shared` precisely because there is no permission difference:
 * a customer, a staff member and an administrator are all sent to their own
 * home screen after signing in, all refused once their account is switched
 * off, and all signed out by a password reset. Three near-identical copies
 * under the role folders would say the opposite — that the rule is per-role
 * and free to diverge. Anything that genuinely does differ is tested in that
 * role's own folder.
 */
const roles = [Role.CUSTOMER, Role.STAFF, Role.ADMIN] as const

/** Where each role lands once it is signed in. */
const home: Record<string, string> = {
  [Role.CUSTOMER]: '/order',
  [Role.STAFF]: '/staff/trips',
  [Role.ADMIN]: '/admin/dashboard',
}

test.group('Signing in', (group) => {
  group.each.setup(() => testUtils.db().truncate())

  for (const role of roles) {
    test(`a ${role} lands on their own home screen`, async ({ client }) => {
      await UserFactory.merge({ role, phone: '081234500001', password: 'password123' }).create()

      const response = await client
        .post('/login')
        .withInertia()
        .header('referer', '/login')
        .json({ phone: '081234500001', password: 'password123' })
        .withCsrfToken()

      response.assertRedirectsTo(home[role])
    })

    /**
     * Refused with exactly the same error as a wrong password, deliberately: a
     * distinct message would confirm to whoever is typing that the number
     * belongs to a real account which happens to be switched off.
     */
    test(`a deactivated ${role} cannot sign in`, async ({ client }) => {
      await UserFactory.merge({
        role,
        phone: '081234500002',
        password: 'password123',
        isActive: false,
      }).create()

      const response = await client
        .post('/login')
        .withInertia()
        .header('referer', '/login')
        .json({ phone: '081234500002', password: 'password123' })
        .withCsrfToken()

      response.assertInertiaPropsContains({
        errors: { phone: 'Nomor telepon atau kata sandi salah.' },
      })
    })
  }
})

test.group('Sessions opened before a password reset', (group) => {
  group.each.setup(() => testUtils.db().truncate())

  /**
   * A reset is what somebody does when they suspect their account is not
   * theirs alone any more, so leaving the sessions that prompted it signed in
   * would make the whole exercise a formality. Sessions are signed cookies
   * with no server-side table to delete from, so `passwordChangedAt` stands in
   * for one: a session stamped before it is refused on its next request.
   */
  for (const role of roles) {
    test(`a ${role} signed in before the reset is signed out`, async ({ client }) => {
      const user = await UserFactory.merge({
        role,
        phone: '081234500003',
        passwordChangedAt: DateTime.now(),
      }).create()

      const response = await client.get(home[role]).withInertia().loginAs(user)

      response.assertRedirectsTo('/login')
    })

    test(`a ${role} who has never reset keeps their session`, async ({ client }) => {
      const user = await UserFactory.merge({
        role,
        phone: '081234500004',
        passwordChangedAt: null,
      }).create()

      const response = await client.get(home[role]).withInertia().loginAs(user)

      response.assertStatus(200)
    })
  }
})
