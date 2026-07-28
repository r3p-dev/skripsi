import { AddressFactory } from '#database/factories/address_factory'
import { OrderFactory } from '#database/factories/order_factory'
import { UserFactory } from '#database/factories/user_factory'
import { appUrl } from '#config/app'
import hash from '@adonisjs/core/services/hash'
import { signedUrlFor } from '@adonisjs/core/services/url_builder'
import testUtils from '@adonisjs/core/services/test_utils'
import { test } from '@japa/runner'

test.group('Customer Profile', (group) => {
  group.each.setup(() => testUtils.db().truncate())

  test('GET /profile shows the account with completed order count and address', async ({
    client,
    assert,
  }) => {
    const customer = await UserFactory.merge({ phone: '081211116001' }).create()
    const address = await AddressFactory.merge({ userId: customer.id, isActive: true }).create()

    await OrderFactory.apply('completed').merge({ userId: customer.id }).createMany(2)
    await OrderFactory.merge({ userId: customer.id }).create()

    const response = await client.get('/profile').withInertia().loginAs(customer)

    response.assertInertiaComponent('customer/profile/show')
    assert.equal(response.inertiaProps.totalOrders, 2)
    assert.equal(response.inertiaProps.address.id, address.id)
  })

  test('PUT /profile changes the display name', async ({ client, assert }) => {
    const customer = await UserFactory.merge({ phone: '081211116002' }).create()

    const response = await client
      .put('/profile')
      .loginAs(customer)
      .json({ name: 'Budi Santoso' })
      .withCsrfToken()

    response.assertRedirectsTo('/profile')

    await customer.refresh()
    assert.equal(customer.name, 'Budi Santoso')
  })

  test('PUT /profile rejects a name that is not alphabetic', async ({ client }) => {
    const customer = await UserFactory.merge({ phone: '081211116003' }).create()

    const response = await client
      .put('/profile')
      .withInertia()
      .loginAs(customer)
      .header('referer', '/profile')
      .json({ name: 'Budi 123' })
      .withCsrfToken()

    response.assertInertiaPropsContains({
      errors: { name: 'Nama lengkap hanya boleh berisi huruf' },
    })
  })
})

/**
 * These use `fields()` rather than `json()` on purpose: `passwordConfirmation` is
 * a validation-only field, so it never reaches the validator's inferred output and
 * the generated route registry rejects it on a typed JSON body.
 */
test.group('Customer Password', (group) => {
  group.each.setup(() => testUtils.db().truncate())

  test('PUT /password changes the password when the current one is correct', async ({
    client,
    assert,
  }) => {
    const customer = await UserFactory.merge({ phone: '081211117001' }).create()

    const response = await client
      .put('/password')
      .loginAs(customer)
      .fields({
        currentPassword: 'password123',
        password: 'newpassword1',
        passwordConfirmation: 'newpassword1',
      })
      .withCsrfToken()

    response.assertRedirectsTo('/profile')

    await customer.refresh()
    assert.isTrue(await hash.verify(customer.password, 'newpassword1'))
  })

  test('PUT /password refuses a wrong current password', async ({ client, assert }) => {
    const customer = await UserFactory.merge({ phone: '081211117002' }).create()

    const response = await client
      .put('/password')
      .withInertia()
      .loginAs(customer)
      .header('referer', '/profile')
      .fields({
        currentPassword: 'wrongpassword1',
        password: 'newpassword1',
        passwordConfirmation: 'newpassword1',
      })
      .withCsrfToken()

    response.assertInertiaPropsContains({
      errors: { currentPassword: 'Kata sandi saat ini salah' },
    })

    await customer.refresh()
    assert.isTrue(await hash.verify(customer.password, 'password123'))
  })

  test('PUT /password requires the confirmation to match', async ({ client }) => {
    const customer = await UserFactory.merge({ phone: '081211117003' }).create()

    const response = await client
      .put('/password')
      .withInertia()
      .loginAs(customer)
      .header('referer', '/profile')
      .fields({
        currentPassword: 'password123',
        password: 'newpassword1',
        passwordConfirmation: 'differentpass1',
      })
      .withCsrfToken()

    response.assertInertiaPropsContains({
      errors: { passwordConfirmation: 'Konfirmasi kata sandi tidak cocok' },
    })
  })
})

test.group('Customer Phone Change', (group) => {
  group.each.setup(() => testUtils.db().truncate())

  test('POST /phone refuses the number the customer already has', async ({ client }) => {
    const customer = await UserFactory.merge({ phone: '081211118001' }).create()

    const response = await client
      .post('/phone')
      .withInertia()
      .loginAs(customer)
      .header('referer', '/profile')
      .json({ phone: '081211118001' })
      .withCsrfToken()

    response.assertInertiaPropsContains({
      errors: { phone: 'Nomor telepon baru tidak boleh sama dengan yang lama' },
    })
  })

  test('POST /phone refuses a number already used by someone else', async ({ client }) => {
    const customer = await UserFactory.merge({ phone: '081211118002' }).create()
    await UserFactory.merge({ phone: '081211118003' }).create()

    const response = await client
      .post('/phone')
      .withInertia()
      .loginAs(customer)
      .header('referer', '/profile')
      .json({ phone: '081211118003' })
      .withCsrfToken()

    response.assertInertiaPropsContains({
      errors: { phone: 'Nomor telepon sudah digunakan' },
    })
  })

  /**
   * The link normally arrives over WhatsApp, so the test signs it directly —
   * the same trick `browser/auth.spec.ts` uses for password reset.
   */
  test('GET /phone/verify applies the change when the link is properly signed', async ({
    client,
    assert,
  }) => {
    const customer = await UserFactory.merge({ phone: '081211118006' }).create()

    const verificationUrl = signedUrlFor(
      'customer.phone.update',
      {},
      { qs: { phone: '081211118007' }, expiresIn: '15m', prefixUrl: appUrl }
    )

    const response = await client.get(verificationUrl).withInertia().loginAs(customer)

    response.assertRedirectsTo('/profile')
    response.assertInertiaPropsContains({
      flash: { success: 'Nomor telepon berhasil diverifikasi' },
    })

    await customer.refresh()
    assert.equal(customer.phone, '081211118007')
  })

  test('a phone verification link stops working once it expires', async ({ client, assert }) => {
    const customer = await UserFactory.merge({ phone: '081211118008' }).create()

    const verificationUrl = signedUrlFor(
      'customer.phone.update',
      {},
      { qs: { phone: '081211118009' }, expiresIn: '-1m', prefixUrl: appUrl }
    )

    const response = await client.get(verificationUrl).withInertia().loginAs(customer)

    response.assertInertiaComponent('errors/invalid_signature')

    await customer.refresh()
    assert.equal(customer.phone, '081211118008')
  })

  test('GET /phone/verify rejects a link without a valid signature', async ({ client, assert }) => {
    const customer = await UserFactory.merge({ phone: '081211118004' }).create()

    const response = await client
      .get('/phone/verify')
      .qs({ phone: '081211118005' })
      .withInertia()
      .loginAs(customer)

    response.assertInertiaComponent('errors/invalid_signature')

    await customer.refresh()
    assert.equal(customer.phone, '081211118004')
  })
})
