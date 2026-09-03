import { test } from '@japa/runner'
import AdminProfileService from '#services/admin_profile_service'
import CustomerProfileService from '#services/customer_profile_service'
import StaffProfileService from '#services/staff_profile_service'
import type ProfileService from '#services/profile_service'
import User from '#models/user'
import hash from '@adonisjs/core/services/hash'
import testUtils from '@adonisjs/core/services/test_utils'
import { Role } from '#enums/role_enum'
import PhoneChangeRequest from '#models/phone_change_request'
import { BrokenWhatsappService, FakeWhatsappService } from '#tests/utils/fakes'
import { USER_PASSWORD, UserFactory } from '#database/factories/user_factory'
import { commitRoutes, validationMessages } from '#tests/utils/helpers'
import { DateTime } from 'luxon'

function makeService(): { service: ProfileService; whatsapp: FakeWhatsappService } {
  const whatsapp = new FakeWhatsappService()

  return { service: new CustomerProfileService(whatsapp), whatsapp }
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
    const { service, whatsapp } = makeService()
    const user = await UserFactory.create()

    await service.requestChangePhone({ phone: '081200000601' }, user)

    const link = whatsapp.messageTo('081200000601')

    assert.isDefined(link)
    assert.include(link!.body, '/phone/verify')
    assert.include(link!.body, 'signature=')
  })

  test('the old number is told a change was asked for', async ({ assert }) => {
    const { service, whatsapp } = makeService()
    const user = await UserFactory.create()

    await service.requestChangePhone({ phone: '081200000611' }, user)

    const notice = whatsapp.messageTo(user.phone)

    assert.isDefined(notice)
    assert.include(notice!.body, '081200000611')
  })

  test('each role builds the link for its own panel', async ({ assert }) => {
    const customerWhatsapp = new FakeWhatsappService()
    const staffWhatsapp = new FakeWhatsappService()
    const adminWhatsapp = new FakeWhatsappService()

    await new CustomerProfileService(customerWhatsapp).requestChangePhone(
      { phone: '081200000621' },
      await UserFactory.create()
    )
    await new StaffProfileService(staffWhatsapp).requestChangePhone(
      { phone: '081200000622' },
      await UserFactory.apply('staff').create()
    )
    await new AdminProfileService(adminWhatsapp).requestChangePhone(
      { phone: '081200000623' },
      await UserFactory.apply('admin').create()
    )

    assert.include(customerWhatsapp.messageTo('081200000621')!.body, '/phone/verify')
    assert.include(staffWhatsapp.messageTo('081200000622')!.body, `/${Role.STAFF}/phone/verify`)
    assert.include(adminWhatsapp.messageTo('081200000623')!.body, `/${Role.ADMIN}/phone/verify`)
  })

  test('a number another account is already verifying is refused', async ({ assert }) => {
    const { service } = makeService()
    const first = await UserFactory.create()
    const second = await UserFactory.create()

    await service.requestChangePhone({ phone: '081200000603' }, first)

    const { service: rival, whatsapp: rivalWhatsapp } = makeService()

    const [failure] = await validationMessages(() =>
      rival.requestChangePhone({ phone: '081200000603' }, second)
    )

    assert.equal(failure.field, 'phone')
    assert.match(failure.message, /menunggu verifikasi/i)
    assert.isEmpty(rivalWhatsapp.messages)
  })

  test('asking again releases the hold on the number asked for before', async ({ assert }) => {
    const { service } = makeService()
    const user = await UserFactory.create()
    const other = await UserFactory.create()

    await service.requestChangePhone({ phone: '081200000604' }, user)
    await service.requestChangePhone({ phone: '081200000605' }, user)

    const { service: rival } = makeService()

    await rival.requestChangePhone({ phone: '081200000604' }, other)

    assert.isNotNull(await PhoneChangeRequest.findBy('phone', '081200000604'))
  })

  test('a hold is let go when the message could not be sent', async ({ assert }) => {
    const service = new CustomerProfileService(new BrokenWhatsappService())
    const user = await UserFactory.create()

    await assert.rejects(() => service.requestChangePhone({ phone: '081200000606' }, user))

    assert.isNull(await PhoneChangeRequest.findBy('phone', '081200000606'))
  })

  test('asking for the number you already have is refused', async ({ assert }) => {
    const { service, whatsapp } = makeService()
    const user = await UserFactory.create()

    const [failure] = await validationMessages(() =>
      service.requestChangePhone({ phone: user.phone }, user)
    )

    assert.equal(failure.field, 'phone')
    assert.match(failure.message, /tidak boleh sama/i)
    assert.isEmpty(whatsapp.messages)
  })

  test("asking for someone else's number is refused", async ({ assert }) => {
    const { service, whatsapp } = makeService()
    const user = await UserFactory.create()
    const other = await UserFactory.create()

    const [failure] = await validationMessages(() =>
      service.requestChangePhone({ phone: other.phone }, user)
    )

    assert.equal(failure.field, 'phone')
    assert.match(failure.message, /sudah digunakan/i)
    assert.isEmpty(whatsapp.messages)
  })
})

test.group('ProfileService | confirming a phone change', (group) => {
  group.setup(() => commitRoutes())
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  test('the number is swapped once the link is followed', async ({ assert }) => {
    const { service } = makeService()
    const user = await UserFactory.create()

    await service.requestChangePhone({ phone: '081200000701' }, user)
    await service.verifyPhoneChange('081200000701', user)

    const stored = await User.findOrFail(user.id)

    assert.equal(stored.phone, '081200000701')
  })

  test('the hold is let go once the number has moved over', async ({ assert }) => {
    const { service } = makeService()
    const user = await UserFactory.create()

    await service.requestChangePhone({ phone: '081200000702' }, user)
    await service.verifyPhoneChange('081200000702', user)

    assert.isNull(await PhoneChangeRequest.findBy('phone', '081200000702'))
  })

  test('confirming the number you already have is a no-op', async ({ assert }) => {
    const { service } = makeService()
    const user = await UserFactory.create()
    const original = user.phone

    await service.verifyPhoneChange(original, user)

    const stored = await User.findOrFail(user.id)

    assert.equal(stored.phone, original)
  })

  test('a number nobody asked to hold is refused', async ({ assert }) => {
    const { service } = makeService()
    const user = await UserFactory.create()

    const [failure] = await validationMessages(() =>
      service.verifyPhoneChange('081200000703', user)
    )

    assert.equal(failure.field, 'phone')
    assert.match(failure.message, /tidak berlaku/i)

    const stored = await User.findOrFail(user.id)

    assert.equal(stored.phone, user.phone)
  })

  test('a hold that has run out is refused', async ({ assert }) => {
    const { service } = makeService()
    const user = await UserFactory.create()

    await service.requestChangePhone({ phone: '081200000704' }, user)

    const held = await PhoneChangeRequest.findByOrFail('phone', '081200000704')
    await held.merge({ expiresAt: DateTime.now().minus({ minutes: 1 }) }).save()

    const [failure] = await validationMessages(() =>
      service.verifyPhoneChange('081200000704', user)
    )

    assert.equal(failure.field, 'phone')
    assert.match(failure.message, /tidak berlaku/i)
  })

  test('a number claimed in the meantime is refused', async ({ assert }) => {
    const { service } = makeService()
    const user = await UserFactory.create()
    const other = await UserFactory.create()

    await service.requestChangePhone({ phone: '081200000705' }, user)

    await other.merge({ phone: '081200000705' }).save()

    const [failure] = await validationMessages(() =>
      service.verifyPhoneChange('081200000705', user)
    )

    assert.equal(failure.field, 'phone')
    assert.match(failure.message, /sudah digunakan/i)

    const stored = await User.findOrFail(user.id)

    assert.notEqual(stored.phone, '081200000705')
  })
})
