import { test } from '@japa/runner'
import AuthService from '#services/auth_service'
import User from '#models/user'
import hash from '@adonisjs/core/services/hash'
import testUtils from '@adonisjs/core/services/test_utils'
import { Role } from '#enums/role_enum'
import { FakeFonnteService } from '#tests/utils/fakes'
import { USER_PASSWORD, UserFactory } from '#database/factories/user_factory'
import { commitRoutes } from '#tests/utils/helpers'

function makeService(): { service: AuthService; fonnte: FakeFonnteService } {
  const fonnte = new FakeFonnteService()

  return { service: new AuthService(fonnte), fonnte }
}

test.group('AuthService | signing up', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  test('a new account is always a customer account', async ({ assert }) => {
    const { service } = makeService()

    const user = await service.signup({
      name: 'Pelanggan Baru',
      phone: '081200000501',
      password: USER_PASSWORD,
    })

    assert.equal(user.role, Role.CUSTOMER)
    assert.equal(user.phone, '081200000501')
  })

  test('the password never reaches the database in the clear', async ({ assert }) => {
    const { service } = makeService()

    const user = await service.signup({
      name: 'Pelanggan Baru',
      phone: '081200000502',
      password: USER_PASSWORD,
    })

    assert.notEqual(user.password, USER_PASSWORD)
    assert.isTrue(await hash.verify(user.password, USER_PASSWORD))
  })
})

test.group('AuthService | signing in', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  test('the right phone and password get you in', async ({ assert }) => {
    const { service } = makeService()
    const user = await UserFactory.create()

    const authenticated = await service.authenticate({
      phone: user.phone,
      password: USER_PASSWORD,
    })

    assert.equal(authenticated.id, user.id)
  })

  test('the wrong password does not', async ({ assert }) => {
    const { service } = makeService()
    const user = await UserFactory.create()

    await assert.rejects(() =>
      service.authenticate({ phone: user.phone, password: 'salahsekali9' })
    )
  })

  test('an unknown phone does not', async ({ assert }) => {
    const { service } = makeService()

    await assert.rejects(() =>
      service.authenticate({ phone: '081999999999', password: USER_PASSWORD })
    )
  })

  test('a deactivated account does not, even with the right password', async ({ assert }) => {
    const { service } = makeService()
    const user = await UserFactory.apply('inactive').create()

    await assert.rejects(() => service.authenticate({ phone: user.phone, password: USER_PASSWORD }))
  })
})

test.group('AuthService | forgotten passwords', (group) => {
  group.setup(() => commitRoutes())
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  test('an active account is sent a signed reset link', async ({ assert }) => {
    const { service, fonnte } = makeService()
    const user = await UserFactory.create()

    await service.requestPasswordReset({ phone: user.phone })

    assert.lengthOf(fonnte.messages, 1)
    assert.equal(fonnte.lastMessage!.target, user.phone)
    assert.include(fonnte.lastMessage!.body, '/reset-password')
    assert.include(fonnte.lastMessage!.body, 'signature=')
  })

  test('an unknown phone is met with silence, not an error', async ({ assert }) => {
    const { service, fonnte } = makeService()

    await service.requestPasswordReset({ phone: '081999999998' })

    assert.isEmpty(fonnte.messages)
  })

  test('a deactivated account gets no link either', async ({ assert }) => {
    const { service, fonnte } = makeService()
    const user = await UserFactory.apply('inactive').create()

    await service.requestPasswordReset({ phone: user.phone })

    assert.isEmpty(fonnte.messages)
  })
})

test.group('AuthService | resetting a password', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  test('the new password replaces the old one', async ({ assert }) => {
    const { service } = makeService()
    const user = await UserFactory.create()

    await service.resetPassword({ password: 'sandibaru9' }, user.phone)

    const stored = await User.findOrFail(user.id)

    assert.isTrue(await hash.verify(stored.password, 'sandibaru9'))
    assert.isFalse(await hash.verify(stored.password, USER_PASSWORD))
  })

  test('the reset is stamped so open sessions can be spotted as stale', async ({ assert }) => {
    const { service } = makeService()
    const user = await UserFactory.create()

    assert.isNotOk(user.passwordChangedAt)

    await service.resetPassword({ password: 'sandibaru9' }, user.phone)

    const stored = await User.findOrFail(user.id)

    assert.isNotNull(stored.passwordChangedAt)
  })

  test('remembered devices are logged out', async ({ assert }) => {
    const { service } = makeService()
    const user = await UserFactory.create()

    await User.rememberMeTokens.create(user, '30d')
    assert.lengthOf(await User.rememberMeTokens.all(user), 1)

    await service.resetPassword({ password: 'sandibaru9' }, user.phone)

    assert.isEmpty(await User.rememberMeTokens.all(user))
  })

  test('an unknown phone cannot reset anything', async ({ assert }) => {
    const { service } = makeService()

    await assert.rejects(() => service.resetPassword({ password: 'sandibaru9' }, '081999999997'))
  })
})
