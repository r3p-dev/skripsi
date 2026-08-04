import { OrderFactory } from '#database/factories/order_factory'
import { UserFactory } from '#database/factories/user_factory'
import { PaymentMethod, TransactionStatus } from '#enums/transaction_enum'
import Transaction from '#models/transaction'
import { appUrl } from '#config/app'
import hash from '@adonisjs/core/services/hash'
import { signedUrlFor } from '@adonisjs/core/services/url_builder'
import testUtils from '@adonisjs/core/services/test_utils'
import { test } from '@japa/runner'

test.group('Admin Profile', (group) => {
  group.each.setup(() => testUtils.db().truncate())

  /**
   * An admin places no orders, so the customer's "total orders" figure would
   * always read zero here. The profile reports on the shop instead.
   */
  test('GET /admin/profile counts the team and the settled payments', async ({
    client,
    assert,
  }) => {
    const admin = await UserFactory.apply('admin').merge({ phone: '081360000001' }).create()
    await UserFactory.apply('staff').merge({ phone: '081360000002' }).create()
    await UserFactory.apply('staff').merge({ phone: '081360000003' }).create()

    const order = await OrderFactory.apply('completed').merge({ totalPrice: 50000 }).create()
    await Transaction.create({
      orderId: order.id,
      paymentMethod: PaymentMethod.CASH,
      midtransOrderId: null,
      midtransTransactionId: null,
      status: TransactionStatus.PAID,
      qrCode: null,
    })

    const response = await client.get('/admin/profile').withInertia().loginAs(admin)

    response.assertInertiaComponent('admin/profile/show')
    assert.equal(response.inertiaProps.teamSize, 2)
    assert.equal(response.inertiaProps.transactions, 1)
  })

  test('a pending payment is not counted as settled', async ({ client, assert }) => {
    const admin = await UserFactory.apply('admin').merge({ phone: '081360001001' }).create()
    const order = await OrderFactory.apply('waitingPayment').merge({ totalPrice: 50000 }).create()

    await Transaction.create({
      orderId: order.id,
      paymentMethod: PaymentMethod.QRIS,
      midtransOrderId: `${order.orderNumber}-1`,
      midtransTransactionId: 'trx-1',
      status: TransactionStatus.PENDING,
      qrCode: null,
    })

    const response = await client.get('/admin/profile').withInertia().loginAs(admin)

    assert.equal(response.inertiaProps.transactions, 0)
  })
})

/**
 * `fields()` rather than `json()`: `passwordConfirmation` is validation-only,
 * so it never reaches the validator's inferred output and the generated route
 * registry rejects it on a typed JSON body.
 */
test.group('Admin Password', (group) => {
  group.each.setup(() => testUtils.db().truncate())

  test('PUT /admin/profile changes the password', async ({ client, assert }) => {
    const admin = await UserFactory.apply('admin').merge({ phone: '081361000001' }).create()

    const response = await client
      .put('/admin/profile')
      .loginAs(admin)
      .fields({
        currentPassword: 'password123',
        password: 'newpassword1',
        passwordConfirmation: 'newpassword1',
      })
      .withCsrfToken()

    response.assertRedirectsTo('/admin/profile')

    await admin.refresh()
    assert.isTrue(await hash.verify(admin.password, 'newpassword1'))
  })

  test('PUT /admin/profile refuses a wrong current password', async ({ client, assert }) => {
    const admin = await UserFactory.apply('admin').merge({ phone: '081361000002' }).create()

    const response = await client
      .put('/admin/profile')
      .withInertia()
      .loginAs(admin)
      .header('referer', '/admin/profile')
      .fields({
        currentPassword: 'wrongpassword1',
        password: 'newpassword1',
        passwordConfirmation: 'newpassword1',
      })
      .withCsrfToken()

    response.assertInertiaPropsContains({
      errors: { currentPassword: 'Kata sandi saat ini salah' },
    })

    await admin.refresh()
    assert.isTrue(await hash.verify(admin.password, 'password123'))
  })
})

test.group('Admin Phone Change', (group) => {
  group.each.setup(() => testUtils.db().truncate())

  test('POST /admin/phone refuses the number the admin already has', async ({ client }) => {
    const admin = await UserFactory.apply('admin').merge({ phone: '081362000001' }).create()

    const response = await client
      .post('/admin/phone')
      .withInertia()
      .loginAs(admin)
      .header('referer', '/admin/profile')
      .json({ phone: '081362000001' })
      .withCsrfToken()

    response.assertInertiaPropsContains({
      errors: { phone: 'Nomor telepon baru tidak boleh sama dengan yang lama' },
    })
  })

  test('a properly signed admin link applies the change', async ({ client, assert }) => {
    const admin = await UserFactory.apply('admin').merge({ phone: '081362001001' }).create()

    const verificationUrl = signedUrlFor(
      'admin.phone.update',
      {},
      {
        qs: { phone: '081362001002', userId: admin.id },
        expiresIn: '15m',
        prefixUrl: appUrl,
      }
    )

    const response = await client.get(verificationUrl).withInertia().loginAs(admin)

    response.assertRedirectsTo('/admin/profile')

    await admin.refresh()
    assert.equal(admin.phone, '081362001002')
  })

  /**
   * Role middleware would bounce an admin off the staff route, which is why
   * `ProfileService` signs a per-role verification link.
   */
  test('a staff-signed link does not work for an admin', async ({ client, assert }) => {
    const admin = await UserFactory.apply('admin').merge({ phone: '081362002001' }).create()

    const staffUrl = signedUrlFor(
      'staff.phone.update',
      {},
      {
        qs: { phone: '081362002002', userId: admin.id },
        expiresIn: '15m',
        prefixUrl: appUrl,
      }
    )

    const response = await client.get(staffUrl).loginAs(admin)

    response.assertRedirectsTo('/admin/dashboard')

    await admin.refresh()
    assert.equal(admin.phone, '081362002001')
  })

  test('an expired admin link changes nothing', async ({ client, assert }) => {
    const admin = await UserFactory.apply('admin').merge({ phone: '081362003001' }).create()

    const verificationUrl = signedUrlFor(
      'admin.phone.update',
      {},
      {
        qs: { phone: '081362003002', userId: admin.id },
        expiresIn: '-1m',
        prefixUrl: appUrl,
      }
    )

    const response = await client.get(verificationUrl).withInertia().loginAs(admin)

    response.assertInertiaComponent('errors/invalid_signature')

    await admin.refresh()
    assert.equal(admin.phone, '081362003001')
  })
})
