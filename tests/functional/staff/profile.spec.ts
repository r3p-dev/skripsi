import { OrderFactory } from '#database/factories/order_factory'
import { UserFactory } from '#database/factories/user_factory'
import OrderAction from '#models/order_action'
import { ActionName } from '#enums/order_action_enum'
import { appUrl } from '#config/app'
import hash from '@adonisjs/core/services/hash'
import { signedUrlFor } from '@adonisjs/core/services/url_builder'
import testUtils from '@adonisjs/core/services/test_utils'
import { test } from '@japa/runner'

function recordAction(orderId: number, staffId: number, name: string) {
  return OrderAction.create({ orderId, staffId, name, photoPath: null, note: null })
}

test.group('Staff Profile', (group) => {
  group.each.setup(() => testUtils.db().truncate())

  test('GET /staff/profile counts the tasks the staff member finished', async ({
    client,
    assert,
  }) => {
    const staff = await UserFactory.apply('staff').merge({ phone: '081244440001' }).create()
    const order = await OrderFactory.create()

    await recordAction(order.id, staff.id, ActionName.PICKUP)
    await recordAction(order.id, staff.id, ActionName.DELIVERY)
    await recordAction(order.id, staff.id, ActionName.INSPECTION)
    await recordAction(order.id, staff.id, ActionName.CLEANING_DONE)

    const response = await client.get('/staff/profile').withInertia().loginAs(staff)

    response.assertInertiaComponent('staff/profile/show')
    assert.equal(response.inertiaProps.totalTasks, 4)
  })

  test('claiming and releasing do not count as finished work', async ({ client, assert }) => {
    const staff = await UserFactory.apply('staff').merge({ phone: '081244440002' }).create()
    const order = await OrderFactory.create()

    await recordAction(order.id, staff.id, ActionName.ATTEMPT_PICKUP)
    await recordAction(order.id, staff.id, ActionName.RELEASE_PICKUP)
    await recordAction(order.id, staff.id, ActionName.PICKUP)

    const response = await client.get('/staff/profile').withInertia().loginAs(staff)

    assert.equal(response.inertiaProps.totalTasks, 1)
  })

  test('another staff member work is not counted', async ({ client, assert }) => {
    const staff = await UserFactory.apply('staff').merge({ phone: '081244440003' }).create()
    const other = await UserFactory.apply('staff').merge({ phone: '081244440004' }).create()
    const order = await OrderFactory.create()

    await recordAction(order.id, other.id, ActionName.PICKUP)

    const response = await client.get('/staff/profile').withInertia().loginAs(staff)

    assert.equal(response.inertiaProps.totalTasks, 0)
  })
})

/**
 * `fields()` rather than `json()`: `passwordConfirmation` is validation-only, so
 * it never reaches the validator's inferred output and the generated route
 * registry rejects it on a typed JSON body.
 */
test.group('Staff Password', (group) => {
  group.each.setup(() => testUtils.db().truncate())

  test('PUT /staff/profile changes the password', async ({ client, assert }) => {
    const staff = await UserFactory.apply('staff').merge({ phone: '081244441001' }).create()

    const response = await client
      .put('/staff/profile')
      .loginAs(staff)
      .fields({
        currentPassword: 'password123',
        password: 'newpassword1',
        passwordConfirmation: 'newpassword1',
      })
      .withCsrfToken()

    response.assertRedirectsTo('/staff/profile')

    await staff.refresh()
    assert.isTrue(await hash.verify(staff.password, 'newpassword1'))
  })

  test('PUT /staff/profile refuses a wrong current password', async ({ client, assert }) => {
    const staff = await UserFactory.apply('staff').merge({ phone: '081244441002' }).create()

    const response = await client
      .put('/staff/profile')
      .withInertia()
      .loginAs(staff)
      .header('referer', '/staff/profile')
      .fields({
        currentPassword: 'wrongpassword1',
        password: 'newpassword1',
        passwordConfirmation: 'newpassword1',
      })
      .withCsrfToken()

    response.assertInertiaPropsContains({
      errors: { currentPassword: 'Kata sandi saat ini salah' },
    })

    await staff.refresh()
    assert.isTrue(await hash.verify(staff.password, 'password123'))
  })
})

test.group('Staff Phone Change', (group) => {
  group.each.setup(() => testUtils.db().truncate())

  test('POST /staff/phone refuses the number the staff member already has', async ({ client }) => {
    const staff = await UserFactory.apply('staff').merge({ phone: '081244442001' }).create()

    const response = await client
      .post('/staff/phone')
      .withInertia()
      .loginAs(staff)
      .header('referer', '/staff/profile')
      .json({ phone: '081244442001' })
      .withCsrfToken()

    response.assertInertiaPropsContains({
      errors: { phone: 'Nomor telepon baru tidak boleh sama dengan yang lama' },
    })
  })

  test('POST /staff/phone refuses a number already used by someone else', async ({ client }) => {
    const staff = await UserFactory.apply('staff').merge({ phone: '081244442002' }).create()
    await UserFactory.merge({ phone: '081244442003' }).create()

    const response = await client
      .post('/staff/phone')
      .withInertia()
      .loginAs(staff)
      .header('referer', '/staff/profile')
      .json({ phone: '081244442003' })
      .withCsrfToken()

    response.assertInertiaPropsContains({
      errors: { phone: 'Nomor telepon sudah digunakan' },
    })
  })

  /**
   * The signed link is what proves ownership of the new number. Staff get the
   * `staff.phone.update` route, not the customer one — role middleware would
   * bounce them off that.
   */
  test('a properly signed staff link applies the change', async ({ client, assert }) => {
    const staff = await UserFactory.apply('staff').merge({ phone: '081244442004' }).create()

    const verificationUrl = signedUrlFor(
      'staff.phone.update',
      {},
      {
        qs: { phone: '081244442005', userId: staff.id },
        expiresIn: '15m',
        prefixUrl: appUrl,
      }
    )

    const response = await client.get(verificationUrl).withInertia().loginAs(staff)

    response.assertRedirectsTo('/staff/profile')
    response.assertInertiaPropsContains({
      flash: { success: 'Nomor telepon berhasil diverifikasi' },
    })

    await staff.refresh()
    assert.equal(staff.phone, '081244442005')
  })

  test('an expired staff link changes nothing', async ({ client, assert }) => {
    const staff = await UserFactory.apply('staff').merge({ phone: '081244442006' }).create()

    const verificationUrl = signedUrlFor(
      'staff.phone.update',
      {},
      {
        qs: { phone: '081244442007', userId: staff.id },
        expiresIn: '-1m',
        prefixUrl: appUrl,
      }
    )

    const response = await client.get(verificationUrl).withInertia().loginAs(staff)

    response.assertInertiaComponent('errors/invalid_signature')

    await staff.refresh()
    assert.equal(staff.phone, '081244442006')
  })

  test('a customer-signed link does not work for staff', async ({ client, assert }) => {
    const staff = await UserFactory.apply('staff').merge({ phone: '081244442008' }).create()

    const customerUrl = signedUrlFor(
      'customer.phone.update',
      {},
      {
        qs: { phone: '081244442009', userId: staff.id },
        expiresIn: '15m',
        prefixUrl: appUrl,
      }
    )

    const response = await client.get(customerUrl).loginAs(staff)

    // Role middleware sends them back to their own landing page.
    response.assertRedirectsTo('/staff/trips')

    await staff.refresh()
    assert.equal(staff.phone, '081244442008')
  })
})
