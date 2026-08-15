import { test } from '@japa/runner'
import type { ApiClient } from '@japa/api-client'
import FonnteService from '#services/fonnte_service'
import User from '#models/user'
import app from '@adonisjs/core/services/app'
import hash from '@adonisjs/core/services/hash'
import testUtils from '@adonisjs/core/services/test_utils'
import { Role } from '#enums/role_enum'
import { BrokenFonnteService, FakeFonnteService } from '#tests/utils/fakes'
import { USER_PASSWORD, UserFactory } from '#database/factories/user_factory'
import { inputErrors, toRelativeUrl } from '#tests/utils/helpers'

const HOME_FOR = {
  [Role.CUSTOMER]: '/profile',
  [Role.STAFF]: '/staff/profile',
  [Role.ADMIN]: '/admin/profile',
} as const

test.group('Auth | the pages a guest may see', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  test('the sign-up page', async ({ client }) => {
    const response = await client.get('/signup').withInertia()

    response.assertStatus(200)
    response.assertInertiaComponent('auth/signup')
  })

  test('the sign-in page', async ({ client }) => {
    const response = await client.get('/login').withInertia()

    response.assertStatus(200)
    response.assertInertiaComponent('auth/login')
  })

  test('the staff sign-in page', async ({ client }) => {
    const response = await client.get('/internal/login').withInertia()

    response.assertStatus(200)
    response.assertInertiaComponent('auth/internal_login')
  })

  test('the forgotten password page', async ({ client }) => {
    const response = await client.get('/forgot-password').withInertia()

    response.assertStatus(200)
    response.assertInertiaComponent('auth/forgot_password')
  })

  test('a signed-in customer is sent to their own pages instead', async ({ client }) => {
    const user = await UserFactory.create()

    const response = await client.get('/login').loginAs(user).redirects(0)

    response.assertStatus(302)
    response.assertHeader('location', '/profile')
  })
})

test.group('Auth | signing up', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  test('a new customer is registered and signed in', async ({ client, assert }) => {
    const response = await client.post('/signup').withCsrfToken().redirects(0).form({
      name: 'Pelanggan Baru',
      phone: '081200000801',
      password: USER_PASSWORD,
      passwordConfirmation: USER_PASSWORD,
    })

    response.assertStatus(302)
    response.assertHeader('location', '/profile')
    response.assertFlashMessage('success', 'Akun berhasil dibuat. Selamat datang!')

    const user = await User.findByOrFail('phone', '081200000801')

    assert.equal(user.role, Role.CUSTOMER)
    assert.isTrue(user.isActive)
    assert.isTrue(await hash.verify(user.password, USER_PASSWORD))
  })

  test('a phone number already in use is refused', async ({ client, assert }) => {
    const existing = await UserFactory.create()

    const response = await client.post('/signup').withCsrfToken().redirects(0).form({
      name: 'Pelanggan Kembar',
      phone: existing.phone,
      password: USER_PASSWORD,
      passwordConfirmation: USER_PASSWORD,
    })

    response.assertStatus(302)
    assert.property(inputErrors(response), 'phone')

    assert.lengthOf(await User.query().where('phone', existing.phone), 1)
  })

  test('a mismatched confirmation is refused', async ({ client, assert }) => {
    const response = await client.post('/signup').withCsrfToken().redirects(0).form({
      name: 'Pelanggan Baru',
      phone: '081200000802',
      password: USER_PASSWORD,
      passwordConfirmation: 'sandilain9',
    })

    response.assertStatus(302)
    assert.property(inputErrors(response), 'passwordConfirmation')

    assert.isNull(await User.findBy('phone', '081200000802'))
  })

  test('a phone number that is not Indonesian is refused', async ({ client, assert }) => {
    const response = await client.post('/signup').withCsrfToken().redirects(0).form({
      name: 'Pelanggan Baru',
      phone: '12345',
      password: USER_PASSWORD,
      passwordConfirmation: USER_PASSWORD,
    })

    response.assertStatus(302)
    assert.property(inputErrors(response), 'phone')
  })
})

test.group('Auth | signing in', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  test('each role lands on its own home page', async ({ client }) => {
    for (const [role, destination] of Object.entries(HOME_FOR)) {
      const user = await UserFactory.merge({ role: role as Role }).create()

      const response = await client
        .post('/login')
        .withCsrfToken()
        .redirects(0)
        .form({ phone: user.phone, password: USER_PASSWORD })

      response.assertStatus(302)
      response.assertHeader('location', destination)
    }
  })

  test('the moment of signing in is recorded on the session', async ({ client }) => {
    const user = await UserFactory.create()

    const response = await client
      .post('/login')
      .withCsrfToken()
      .redirects(0)
      .form({ phone: user.phone, password: USER_PASSWORD })

    response.assertSession('authenticated_at')
  })

  test('the wrong password gets you nowhere', async ({ client }) => {
    const user = await UserFactory.create()

    const response = await client
      .post('/login')
      .withCsrfToken()
      .redirects(0)
      .form({ phone: user.phone, password: 'salahsekali9' })

    response.assertStatus(302)
    response.assertSessionMissing('authenticated_at')
  })

  test('a deactivated account cannot sign in', async ({ client }) => {
    const user = await UserFactory.apply('inactive').create()

    const response = await client
      .post('/login')
      .withCsrfToken()
      .redirects(0)
      .form({ phone: user.phone, password: USER_PASSWORD })

    response.assertStatus(302)
    response.assertSessionMissing('authenticated_at')
  })
})

test.group('Auth | signing out', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  test('signing out sends you back to the front page', async ({ client }) => {
    const user = await UserFactory.create()

    const response = await client.post('/logout').loginAs(user).withCsrfToken().redirects(0)

    response.assertStatus(302)
    response.assertHeader('location', '/')
    response.assertFlashMessage('success', 'Berhasil keluar.')
  })

  test('a guest cannot sign out', async ({ client }) => {
    const response = await client.post('/logout').withCsrfToken().redirects(0)

    response.assertStatus(302)
    response.assertHeader('location', '/login')
  })
})

test.group('Auth | the pages that need an account', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  test('a guest is sent to sign in first', async ({ client }) => {
    const response = await client.get('/orders').redirects(0)

    response.assertStatus(302)
    response.assertHeader('location', '/login')
  })

  test('a customer cannot reach the staff pages', async ({ client }) => {
    const user = await UserFactory.create()

    const response = await client.get('/staff/profile').loginAs(user).redirects(0)

    response.assertStatus(302)
    response.assertHeader('location', '/profile')
    response.assertFlashMessage('error', 'Anda tidak memiliki akses ke halaman ini')
  })

  test('staff cannot reach the customer pages', async ({ client }) => {
    const staff = await UserFactory.apply('staff').create()

    const response = await client.get('/orders').loginAs(staff).redirects(0)

    response.assertStatus(302)
    response.assertHeader('location', '/staff/profile')
  })

  test('staff cannot reach the admin pages', async ({ client }) => {
    const staff = await UserFactory.apply('staff').create()

    const response = await client.get('/admin/profile').loginAs(staff).redirects(0)

    response.assertStatus(302)
    response.assertHeader('location', '/staff/profile')
  })
})

test.group('Auth | forgotten passwords', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())
  group.each.teardown(() => app.container.restoreAll())

  test('a reset link is sent over WhatsApp', async ({ client, assert }) => {
    const fonnte = new FakeFonnteService()

    app.container.swap(FonnteService, () => fonnte)

    const user = await UserFactory.create()

    const response = await client
      .post('/forgot-password')
      .withCsrfToken()
      .redirects(0)
      .form({ phone: user.phone })

    response.assertStatus(302)
    assert.lengthOf(fonnte.messages, 1)
    assert.equal(fonnte.lastMessage!.target, user.phone)
  })

  test('an unknown phone gets the same reassuring answer', async ({ client, assert }) => {
    const fonnte = new FakeFonnteService()

    app.container.swap(FonnteService, () => fonnte)

    const response = await client
      .post('/forgot-password')
      .withCsrfToken()
      .redirects(0)
      .form({ phone: '081999999996' })

    response.assertStatus(302)
    response.assertFlashMessage('success')
    assert.isEmpty(fonnte.messages)
  })

  test('a WhatsApp outage is reported rather than swallowed', async ({ client }) => {
    app.container.swap(FonnteService, () => new BrokenFonnteService())

    const user = await UserFactory.create()

    const response = await client
      .post('/forgot-password')
      .withCsrfToken()
      .redirects(0)
      .form({ phone: user.phone })

    response.assertStatus(302)
    response.assertFlashMessage('error', 'Gagal mengirim pesan WhatsApp.')
  })
})

test.group('Auth | resetting a password', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())
  group.each.teardown(() => app.container.restoreAll())

  /**
   * The reset link is only ever handed to the customer over WhatsApp, so the
   * test reads it back off the fake.
   */
  async function requestResetLink(client: ApiClient, user: User): Promise<string> {
    const fonnte = new FakeFonnteService()

    app.container.swap(FonnteService, () => fonnte)

    await client.post('/forgot-password').withCsrfToken().redirects(0).form({ phone: user.phone })

    return toRelativeUrl(fonnte.lastMessage!.body)
  }

  test('the signed link opens the reset form', async ({ client }) => {
    const user = await UserFactory.create()
    const link = await requestResetLink(client, user)

    const response = await client.get(link).withInertia()

    response.assertStatus(200)
    response.assertInertiaComponent('auth/reset_password')
  })

  test('a tampered link is turned away', async ({ client }) => {
    const user = await UserFactory.create()
    const link = await requestResetLink(client, user)

    const response = await client.get(link.replace(/signature=\w/, 'signature=x')).withInertia()

    response.assertInertiaComponent('errors/invalid_signature')
  })

  test('a link with no signature at all is turned away', async ({ client }) => {
    const response = await client.get('/reset-password?phone=081200000901').withInertia()

    response.assertInertiaComponent('errors/invalid_signature')
  })

  test('the password is changed and the customer sent back to sign in', async ({
    client,
    assert,
  }) => {
    const user = await UserFactory.create()
    const link = await requestResetLink(client, user)

    const response = await client
      .post(link)
      .withCsrfToken()
      .redirects(0)
      .form({ password: 'sandibaru9', passwordConfirmation: 'sandibaru9' })

    response.assertStatus(302)
    assert.match(response.headers().location as string, /^\/login/)

    const stored = await User.findOrFail(user.id)

    assert.isTrue(await hash.verify(stored.password, 'sandibaru9'))
    assert.isNotNull(stored.passwordChangedAt)
  })

  test('the new password must be confirmed', async ({ client, assert }) => {
    const user = await UserFactory.create()
    const link = await requestResetLink(client, user)

    const response = await client
      .post(link)
      .withCsrfToken()
      .redirects(0)
      .form({ password: 'sandibaru9', passwordConfirmation: 'sandilain9' })

    response.assertStatus(302)
    assert.property(inputErrors(response), 'passwordConfirmation')

    const stored = await User.findOrFail(user.id)

    assert.isTrue(await hash.verify(stored.password, USER_PASSWORD))
  })
})
