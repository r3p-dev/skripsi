import { test } from '@japa/runner'
import ProfileService from '#services/profile_service'
import User from '#models/user'
import hash from '@adonisjs/core/services/hash'
import testUtils from '@adonisjs/core/services/test_utils'
import { Role } from '#enums/role_enum'
import { FakeFonnteService } from '#tests/utils/fakes'
import { USER_PASSWORD, UserFactory } from '#database/factories/user_factory'
import { commitRoutes, validationMessages } from '#tests/utils/helpers'

function makeService(): { service: ProfileService; fonnte: FakeFonnteService } {
  const fonnte = new FakeFonnteService()

  return { service: new ProfileService(fonnte), fonnte }
}

test.group('ProfileService | name', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  test('renaming sticks', async ({ assert }) => {
    const { service } = makeService()
    const user = await UserFactory.create()

    await service.changeName({ name: 'Nama Baru' }, user)

    const stored = await User.findOrFail(user.id)

    assert.equal(stored.name, 'Nama Baru')
  })
})

test.group('ProfileService | password', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  test('the password changes when the current one is right', async ({ assert }) => {
    const { service } = makeService()
    const user = await UserFactory.create()

    await service.changePassword({ currentPassword: USER_PASSWORD, password: 'sandibaru9' }, user)

    const stored = await User.findOrFail(user.id)

    assert.isTrue(await hash.verify(stored.password, 'sandibaru9'))
  })

  test('the password stands when the current one is wrong', async ({ assert }) => {
    const { service } = makeService()
    const user = await UserFactory.create()

    const [failure] = await validationMessages(() =>
      service.changePassword({ currentPassword: 'salahsekali9', password: 'sandibaru9' }, user)
    )

    assert.equal(failure.field, 'currentPassword')
    assert.match(failure.message, /salah/i)

    const stored = await User.findOrFail(user.id)

    assert.isTrue(await hash.verify(stored.password, USER_PASSWORD))
  })
})

test.group('ProfileService | asking to change phone', (group) => {
  group.setup(() => commitRoutes())
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  test('a signed verification link is sent to the new number', async ({ assert }) => {
    const { service, fonnte } = makeService()
    const user = await UserFactory.create()

    await service.requestChangePhone({ phone: '081200000601' }, user)

    assert.lengthOf(fonnte.messages, 1)
    assert.equal(fonnte.lastMessage!.target, '081200000601')
    assert.include(fonnte.lastMessage!.body, '/phone/verify')
    assert.include(fonnte.lastMessage!.body, 'signature=')
  })

  test('the link points at the route for the role that asked', async ({ assert }) => {
    const { service, fonnte } = makeService()
    const staff = await UserFactory.apply('staff').create()

    await service.requestChangePhone({ phone: '081200000602' }, staff)

    assert.include(fonnte.lastMessage!.body, `/${Role.STAFF}/phone/verify`)
  })

  test('asking for the number you already have is refused', async ({ assert }) => {
    const { service, fonnte } = makeService()
    const user = await UserFactory.create()

    const [failure] = await validationMessages(() =>
      service.requestChangePhone({ phone: user.phone }, user)
    )

    assert.equal(failure.field, 'phone')
    assert.match(failure.message, /tidak boleh sama/i)
    assert.isEmpty(fonnte.messages)
  })

  test("asking for someone else's number is refused", async ({ assert }) => {
    const { service, fonnte } = makeService()
    const user = await UserFactory.create()
    const other = await UserFactory.create()

    const [failure] = await validationMessages(() =>
      service.requestChangePhone({ phone: other.phone }, user)
    )

    assert.equal(failure.field, 'phone')
    assert.match(failure.message, /sudah digunakan/i)
    assert.isEmpty(fonnte.messages)
  })
})

test.group('ProfileService | confirming a phone change', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  test('the number is swapped once the link is followed', async ({ assert }) => {
    const { service } = makeService()
    const user = await UserFactory.create()

    await service.verifyPhoneChange('081200000701', user)

    const stored = await User.findOrFail(user.id)

    assert.equal(stored.phone, '081200000701')
  })

  test('confirming the number you already have is a no-op', async ({ assert }) => {
    const { service } = makeService()
    const user = await UserFactory.create()
    const original = user.phone

    await service.verifyPhoneChange(original, user)

    const stored = await User.findOrFail(user.id)

    assert.equal(stored.phone, original)
  })

  test('a number claimed in the meantime is refused', async ({ assert }) => {
    const { service } = makeService()
    const user = await UserFactory.create()
    const other = await UserFactory.create()

    const [failure] = await validationMessages(() => service.verifyPhoneChange(other.phone, user))

    assert.equal(failure.field, 'phone')
    assert.match(failure.message, /sudah digunakan/i)

    const stored = await User.findOrFail(user.id)

    assert.notEqual(stored.phone, other.phone)
  })
})
