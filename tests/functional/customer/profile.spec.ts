import { test } from '@japa/runner'
import WhatsappService from '#notifications/whatsapp_service'
import User from '#models/user'
import app from '@adonisjs/core/services/app'
import hash from '@adonisjs/core/services/hash'
import testUtils from '@adonisjs/core/services/test_utils'
import { FakeWhatsappService } from '#tests/utils/fakes'
import { USER_PASSWORD, UserFactory } from '#database/factories/user_factory'
import { createCustomer, inputErrors, toRelativeUrl, withConfirmation } from '#tests/utils/helpers'

test.group('Customer profile | the page', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  test('shows the customer their address alongside their details', async ({ client }) => {
    const customer = await createCustomer()

    const response = await client.get('/profile').loginAs(customer.user).withInertia()

    response.assertStatus(200)
    response.assertInertiaComponent('customer/profile/show')
    response.assertInertiaPropsContains({ address: { street: customer.address.street } })
  })

  test('a guest is sent to sign in', async ({ client }) => {
    const response = await client.get('/profile').redirects(0)

    response.assertStatus(302)
    response.assertHeader('location', '/login')
  })
})

test.group('Customer profile | changing name', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  test('the new name is saved', async ({ client, assert }) => {
    const user = await UserFactory.create()

    const response = await client
      .put('/profile')
      .loginAs(user)
      .withCsrfToken()
      .redirects(0)
      .form({ name: 'Nama Baru' })

    response.assertStatus(302)
    response.assertFlashMessage('success', 'Nama berhasil diperbarui')

    const stored = await User.findOrFail(user.id)

    assert.equal(stored.name, 'Nama Baru')
  })

  test('a name with digits in it is refused', async ({ client, assert }) => {
    const user = await UserFactory.create()

    const response = await client
      .put('/profile')
      .loginAs(user)
      .withCsrfToken()
      .redirects(0)
      .form({ name: 'Nama 123' })

    response.assertStatus(302)
    assert.property(inputErrors(response), 'name')

    const stored = await User.findOrFail(user.id)

    assert.equal(stored.name, user.name)
  })

  test('an empty name is refused', async ({ client, assert }) => {
    const user = await UserFactory.create()

    const response = await client
      .put('/profile')
      .loginAs(user)
      .withCsrfToken()
      .redirects(0)
      .form({ name: '' })

    response.assertStatus(302)
    assert.property(inputErrors(response), 'name')
  })
})

test.group('Customer profile | changing password', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  test('the password changes when the current one is right', async ({ client, assert }) => {
    const user = await UserFactory.create()

    const response = await client
      .put('/password')
      .loginAs(user)
      .withCsrfToken()
      .redirects(0)
      .form(
        withConfirmation({
          currentPassword: USER_PASSWORD,
          password: 'sandibaru9',
          passwordConfirmation: 'sandibaru9',
        })
      )

    response.assertStatus(302)
    response.assertFlashMessage('success', 'Kata sandi berhasil diperbarui')

    const stored = await User.findOrFail(user.id)

    assert.isTrue(await hash.verify(stored.password, 'sandibaru9'))
  })

  test('the wrong current password is refused', async ({ client, assert }) => {
    const user = await UserFactory.create()

    const response = await client
      .put('/password')
      .loginAs(user)
      .withCsrfToken()
      .redirects(0)
      .form(
        withConfirmation({
          currentPassword: 'salahsekali9',
          password: 'sandibaru9',
          passwordConfirmation: 'sandibaru9',
        })
      )

    response.assertStatus(302)
    assert.property(inputErrors(response), 'currentPassword')

    const stored = await User.findOrFail(user.id)

    assert.isTrue(await hash.verify(stored.password, USER_PASSWORD))
  })

  test('a mismatched confirmation is refused', async ({ client, assert }) => {
    const user = await UserFactory.create()

    const response = await client
      .put('/password')
      .loginAs(user)
      .withCsrfToken()
      .redirects(0)
      .form(
        withConfirmation({
          currentPassword: USER_PASSWORD,
          password: 'sandibaru9',
          passwordConfirmation: 'sandilain9',
        })
      )

    response.assertStatus(302)
    assert.property(inputErrors(response), 'passwordConfirmation')
  })

  test('a password without a digit is refused', async ({ client, assert }) => {
    const user = await UserFactory.create()

    const response = await client
      .put('/password')
      .loginAs(user)
      .withCsrfToken()
      .redirects(0)
      .form(
        withConfirmation({
          currentPassword: USER_PASSWORD,
          password: 'hanyahurufsaja',
          passwordConfirmation: 'hanyahurufsaja',
        })
      )

    response.assertStatus(302)
    assert.property(inputErrors(response), 'password')
  })
})

test.group('Customer profile | changing phone number', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())
  group.each.teardown(() => app.container.restoreAll())

  test('a verification link is sent to the new number', async ({ client, assert }) => {
    const whatsapp = new FakeWhatsappService()

    app.container.swap(WhatsappService, () => whatsapp)

    const user = await UserFactory.create()

    const response = await client
      .post('/phone')
      .loginAs(user)
      .withCsrfToken()
      .redirects(0)
      .form({ phone: '081200000451' })

    response.assertStatus(302)
    response.assertFlashMessage('success', 'Permintaan perubahan nomor telepon berhasil dikirim')

    assert.isDefined(whatsapp.messageTo('081200000451'), 'the link goes to the new number')
    assert.isDefined(
      whatsapp.messageTo(user.phone),
      'the old number is told a change was asked for'
    )

    const stored = await User.findOrFail(user.id)

    assert.equal(stored.phone, user.phone, 'the number only changes once the link is followed')
  })

  test('following the link swaps the number over', async ({ client, assert }) => {
    const whatsapp = new FakeWhatsappService()

    app.container.swap(WhatsappService, () => whatsapp)

    const user = await UserFactory.create()

    await client
      .post('/phone')
      .loginAs(user)
      .withCsrfToken()
      .redirects(0)
      .form({ phone: '081200000452' })

    const response = await client
      .get(toRelativeUrl(whatsapp.messageTo('081200000452')!.body))
      .loginAs(user)
      .redirects(0)

    response.assertStatus(302)
    response.assertFlashMessage('success', 'Nomor telepon berhasil diverifikasi')

    const stored = await User.findOrFail(user.id)

    assert.equal(stored.phone, '081200000452')
  })

  test('a tampered link is turned away', async ({ client, assert }) => {
    const whatsapp = new FakeWhatsappService()

    app.container.swap(WhatsappService, () => whatsapp)

    const user = await UserFactory.create()

    await client
      .post('/phone')
      .loginAs(user)
      .withCsrfToken()
      .redirects(0)
      .form({ phone: '081200000453' })

    const link = toRelativeUrl(whatsapp.messageTo('081200000453')!.body)

    const response = await client
      .get(link.replace(/signature=\w/, 'signature=x'))
      .loginAs(user)
      .withInertia()

    response.assertInertiaComponent('errors/invalid_signature')

    const stored = await User.findOrFail(user.id)

    assert.equal(stored.phone, user.phone)
  })

  test('one customer cannot follow another customer link', async ({ client, assert }) => {
    const whatsapp = new FakeWhatsappService()

    app.container.swap(WhatsappService, () => whatsapp)

    const user = await UserFactory.create()
    const intruder = await UserFactory.create()

    await client
      .post('/phone')
      .loginAs(user)
      .withCsrfToken()
      .redirects(0)
      .form({ phone: '081200000454' })

    const response = await client
      .get(toRelativeUrl(whatsapp.messageTo('081200000454')!.body))
      .loginAs(intruder)
      .withInertia()

    response.assertInertiaComponent('errors/invalid_signature')

    const stored = await User.findOrFail(intruder.id)

    assert.equal(stored.phone, intruder.phone)
  })

  test('asking for the number you already have is refused', async ({ client, assert }) => {
    const whatsapp = new FakeWhatsappService()

    app.container.swap(WhatsappService, () => whatsapp)

    const user = await UserFactory.create()

    const response = await client
      .post('/phone')
      .loginAs(user)
      .withCsrfToken()
      .redirects(0)
      .form({ phone: user.phone })

    response.assertStatus(302)
    assert.property(inputErrors(response), 'phone')
    assert.isEmpty(whatsapp.messages)
  })

  test('a number another customer is verifying is refused', async ({ client, assert }) => {
    const whatsapp = new FakeWhatsappService()

    app.container.swap(WhatsappService, () => whatsapp)

    const first = await UserFactory.create()
    const second = await UserFactory.create()

    await client
      .post('/phone')
      .loginAs(first)
      .withCsrfToken()
      .redirects(0)
      .form({ phone: '081200000461' })

    const response = await client
      .post('/phone')
      .loginAs(second)
      .withCsrfToken()
      .redirects(0)
      .form({ phone: '081200000461' })

    response.assertStatus(302)
    assert.property(inputErrors(response), 'phone')

    const link = toRelativeUrl(whatsapp.messageTo('081200000461')!.body)

    await client.get(link).loginAs(first).redirects(0)

    const stored = await User.findOrFail(first.id)

    assert.equal(stored.phone, '081200000461', 'the customer who asked first still gets it')
  })

  test('asking for a number another account holds is refused', async ({ client, assert }) => {
    const whatsapp = new FakeWhatsappService()

    app.container.swap(WhatsappService, () => whatsapp)

    const user = await UserFactory.create()
    const other = await UserFactory.create()

    const response = await client
      .post('/phone')
      .loginAs(user)
      .withCsrfToken()
      .redirects(0)
      .form({ phone: other.phone })

    response.assertStatus(302)
    assert.property(inputErrors(response), 'phone')
    assert.isEmpty(whatsapp.messages)
  })
})
