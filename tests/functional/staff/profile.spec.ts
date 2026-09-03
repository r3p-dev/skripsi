import { test } from '@japa/runner'
import WhatsappService from '#notifications/whatsapp_service'
import User from '#models/user'
import app from '@adonisjs/core/services/app'
import testUtils from '@adonisjs/core/services/test_utils'
import { FakeWhatsappService } from '#tests/utils/fakes'
import { UserFactory } from '#database/factories/user_factory'
import { inputErrors, toRelativeUrl } from '#tests/utils/helpers'

test.group('Staff profile | the page', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  test('a member of staff can see their own profile', async ({ client }) => {
    const staff = await UserFactory.apply('staff').create()

    const response = await client.get('/staff/profile').loginAs(staff).withInertia()

    response.assertStatus(200)
    response.assertInertiaComponent('staff/profile/show')
  })

  test('a customer is turned away', async ({ client }) => {
    const customer = await UserFactory.create()

    const response = await client.get('/staff/profile').loginAs(customer).redirects(0)

    response.assertStatus(302)
    response.assertHeader('location', '/profile')
  })

  test('an admin is turned away', async ({ client }) => {
    const admin = await UserFactory.apply('admin').create()

    const response = await client.get('/staff/profile').loginAs(admin).redirects(0)

    response.assertStatus(302)
    response.assertHeader('location', '/admin/profile')
  })

  test('a guest is sent to sign in', async ({ client }) => {
    const response = await client.get('/staff/profile').redirects(0)

    response.assertStatus(302)
    response.assertHeader('location', '/login')
  })
})

test.group('Staff profile | changing name', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  test('the new name is saved', async ({ client, assert }) => {
    const staff = await UserFactory.apply('staff').create()

    const response = await client
      .put('/staff/profile')
      .loginAs(staff)
      .withCsrfToken()
      .redirects(0)
      .form({ name: 'Petugas Baru' })

    response.assertStatus(302)
    response.assertHeader('location', '/staff/profile')

    const stored = await User.findOrFail(staff.id)

    assert.equal(stored.name, 'Petugas Baru')
  })

  test('a name with digits in it is refused', async ({ client, assert }) => {
    const staff = await UserFactory.apply('staff').create()

    const response = await client
      .put('/staff/profile')
      .loginAs(staff)
      .withCsrfToken()
      .redirects(0)
      .form({ name: 'Petugas 7' })

    response.assertStatus(302)
    assert.property(inputErrors(response), 'name')
  })

  test('a customer cannot rename a member of staff', async ({ client }) => {
    const customer = await UserFactory.create()

    const response = await client
      .put('/staff/profile')
      .loginAs(customer)
      .withCsrfToken()
      .redirects(0)
      .form({ name: 'Penyusup' })

    response.assertStatus(302)
    response.assertHeader('location', '/profile')
  })
})

test.group('Staff profile | changing phone number', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())
  group.each.teardown(() => app.container.restoreAll())

  test('the verification link points at the staff route', async ({ client, assert }) => {
    const whatsapp = new FakeWhatsappService()

    app.container.swap(WhatsappService, () => whatsapp)

    const staff = await UserFactory.apply('staff').create()

    const response = await client
      .post('/staff/phone')
      .loginAs(staff)
      .withCsrfToken()
      .redirects(0)
      .form({ phone: '081200000651' })

    response.assertStatus(302)
    assert.include(whatsapp.messageTo('081200000651')!.body, '/staff/phone/verify')
  })

  test('following the link swaps the number over', async ({ client, assert }) => {
    const whatsapp = new FakeWhatsappService()

    app.container.swap(WhatsappService, () => whatsapp)

    const staff = await UserFactory.apply('staff').create()

    await client
      .post('/staff/phone')
      .loginAs(staff)
      .withCsrfToken()
      .redirects(0)
      .form({ phone: '081200000652' })

    const response = await client
      .get(toRelativeUrl(whatsapp.messageTo('081200000652')!.body))
      .loginAs(staff)
      .redirects(0)

    response.assertStatus(302)

    const stored = await User.findOrFail(staff.id)

    assert.equal(stored.phone, '081200000652')
  })

  test('a tampered link is turned away', async ({ client, assert }) => {
    const whatsapp = new FakeWhatsappService()

    app.container.swap(WhatsappService, () => whatsapp)

    const staff = await UserFactory.apply('staff').create()

    await client
      .post('/staff/phone')
      .loginAs(staff)
      .withCsrfToken()
      .redirects(0)
      .form({ phone: '081200000653' })

    const link = toRelativeUrl(whatsapp.messageTo('081200000653')!.body)

    const response = await client
      .get(link.replace(/signature=\w/, 'signature=x'))
      .loginAs(staff)
      .withInertia()

    response.assertInertiaComponent('errors/invalid_signature')

    const stored = await User.findOrFail(staff.id)

    assert.equal(stored.phone, staff.phone)
  })
})
