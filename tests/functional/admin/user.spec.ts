import { OrderFactory } from '#database/factories/order_factory'
import { UserFactory } from '#database/factories/user_factory'
import { ActionName } from '#enums/order_action_enum'
import { Role } from '#enums/role_enum'
import OrderAction from '#models/order_action'
import User from '#models/user'
import hash from '@adonisjs/core/services/hash'
import testUtils from '@adonisjs/core/services/test_utils'
import { test } from '@japa/runner'

test.group('Admin User Management', (group) => {
  group.each.setup(() => testUtils.db().truncate())

  test('GET /admin/users lists every account with a count per role', async ({ client, assert }) => {
    const admin = await UserFactory.apply('admin').merge({ phone: '081330000001' }).create()
    await UserFactory.merge({ phone: '081330000002' }).create()
    await UserFactory.merge({ phone: '081330000003' }).create()
    await UserFactory.apply('staff').merge({ phone: '081330000004' }).create()

    const response = await client.get('/admin/users').withInertia().loginAs(admin)

    response.assertInertiaComponent('admin/user/index')
    assert.lengthOf(response.inertiaProps.users.data, 4)
    assert.deepEqual(response.inertiaProps.roleCounts, { customer: 2, staff: 1, admin: 1 })
  })

  test('the list narrows to one role', async ({ client, assert }) => {
    const admin = await UserFactory.apply('admin').merge({ phone: '081330001001' }).create()
    const staff = await UserFactory.apply('staff').merge({ phone: '081330001002' }).create()
    await UserFactory.merge({ phone: '081330001003' }).create()

    const response = await client
      .get('/admin/users')
      .qs({ role: 'staff' })
      .withInertia()
      .loginAs(admin)

    assert.lengthOf(response.inertiaProps.users.data, 1)
    assert.equal(response.inertiaProps.users.data[0].id, staff.id)
    assert.equal(response.inertiaProps.role, 'staff')
  })

  test('an unknown role in the query string falls back to everyone', async ({ client, assert }) => {
    const admin = await UserFactory.apply('admin').merge({ phone: '081330001004' }).create()
    await UserFactory.merge({ phone: '081330001005' }).create()

    const response = await client
      .get('/admin/users')
      .qs({ role: 'wizard' })
      .withInertia()
      .loginAs(admin)

    assert.lengthOf(response.inertiaProps.users.data, 2)
    assert.equal(response.inertiaProps.role, '')
  })

  test('the search matches the name and the phone number', async ({ client, assert }) => {
    const admin = await UserFactory.apply('admin').merge({ phone: '081330002001' }).create()
    await UserFactory.merge({ name: 'Siti Rahayu', phone: '081330002002' }).create()
    await UserFactory.merge({ name: 'Budi Santoso', phone: '081330002003' }).create()

    for (const search of ['Siti', '081330002002']) {
      const response = await client.get('/admin/users').qs({ search }).withInertia().loginAs(admin)

      assert.lengthOf(response.inertiaProps.users.data, 1)
      assert.equal(response.inertiaProps.users.data[0].name, 'Siti Rahayu')
    }
  })

  /**
   * `AuthService.signup` always creates a customer, deliberately, so this is
   * the only route by which a staff or admin account comes into existence.
   */
  test('POST /admin/users creates a staff account', async ({ client, assert }) => {
    const admin = await UserFactory.apply('admin').merge({ phone: '081330003001' }).create()

    const response = await client
      .post('/admin/users')
      .loginAs(admin)
      .fields({
        name: 'Petugas Baru',
        phone: '081330003002',
        password: 'password123',
        passwordConfirmation: 'password123',
        role: Role.STAFF,
      })
      .withCsrfToken()

    response.assertRedirectsTo('/admin/users')

    const created = await User.findByOrFail('phone', '081330003002')
    assert.equal(created.role, Role.STAFF)
    assert.isTrue(await hash.verify(created.password, 'password123'))
  })

  test('a duplicate phone number is refused', async ({ client, assert }) => {
    const admin = await UserFactory.apply('admin').merge({ phone: '081330003003' }).create()
    await UserFactory.merge({ phone: '081330003004' }).create()

    const response = await client
      .post('/admin/users')
      .withInertia()
      .loginAs(admin)
      .header('referer', '/admin/users/create')
      .fields({
        name: 'Nama Kembar',
        phone: '081330003004',
        password: 'password123',
        passwordConfirmation: 'password123',
        role: Role.STAFF,
      })
      .withCsrfToken()

    response.assertInertiaPropsContains({ errors: { phone: 'Nomor telepon sudah digunakan' } })
    assert.isNull(await User.findBy('name', 'Nama Kembar'))
  })

  test('PUT /admin/users/:id renames an account without touching its password', async ({
    client,
    assert,
  }) => {
    const admin = await UserFactory.apply('admin').merge({ phone: '081330004001' }).create()
    const staff = await UserFactory.apply('staff').merge({ phone: '081330004002' }).create()

    const response = await client
      .put(`/admin/users/${staff.id}`)
      .loginAs(admin)
      .fields({
        name: 'Nama Diperbaiki',
        phone: staff.phone,
        role: Role.STAFF,
      })
      .withCsrfToken()

    response.assertRedirectsTo('/admin/users')

    await staff.refresh()
    assert.equal(staff.name, 'Nama Diperbaiki')
    assert.isTrue(await hash.verify(staff.password, 'password123'))
  })

  test('a new password is applied when one is typed', async ({ client, assert }) => {
    const admin = await UserFactory.apply('admin').merge({ phone: '081330004003' }).create()
    const staff = await UserFactory.apply('staff').merge({ phone: '081330004004' }).create()

    await client
      .put(`/admin/users/${staff.id}`)
      .loginAs(admin)
      .fields({
        name: staff.name,
        phone: staff.phone,
        role: Role.STAFF,
        password: 'newpassword1',
        passwordConfirmation: 'newpassword1',
      })
      .withCsrfToken()

    await staff.refresh()
    assert.isTrue(await hash.verify(staff.password, 'newpassword1'))
  })

  /**
   * Saving a form that never touched the phone number must not be rejected as
   * a duplicate of the account being edited.
   */
  test('keeping the same phone number is not a duplicate', async ({ client }) => {
    const admin = await UserFactory.apply('admin').merge({ phone: '081330004005' }).create()
    const staff = await UserFactory.apply('staff').merge({ phone: '081330004006' }).create()

    const response = await client
      .put(`/admin/users/${staff.id}`)
      .loginAs(admin)
      .fields({ name: staff.name, phone: staff.phone, role: Role.STAFF })
      .withCsrfToken()

    response.assertRedirectsTo('/admin/users')
  })

  test('taking another account phone number is still refused', async ({ client }) => {
    const admin = await UserFactory.apply('admin').merge({ phone: '081330004007' }).create()
    const staff = await UserFactory.apply('staff').merge({ phone: '081330004008' }).create()
    await UserFactory.merge({ phone: '081330004009' }).create()

    const response = await client
      .put(`/admin/users/${staff.id}`)
      .withInertia()
      .loginAs(admin)
      .header('referer', `/admin/users/${staff.id}/edit`)
      .fields({ name: staff.name, phone: '081330004009', role: Role.STAFF })
      .withCsrfToken()

    response.assertInertiaPropsContains({ errors: { phone: 'Nomor telepon sudah digunakan' } })
  })

  /**
   * Demoting yourself is a one-way door: the save takes effect immediately and
   * role middleware bounces you out of the admin area.
   */
  test('an admin cannot change their own role', async ({ client, assert }) => {
    const admin = await UserFactory.apply('admin').merge({ phone: '081330005001' }).create()

    const response = await client
      .put(`/admin/users/${admin.id}`)
      .withInertia()
      .loginAs(admin)
      .header('referer', `/admin/users/${admin.id}/edit`)
      .fields({ name: admin.name, phone: admin.phone, role: Role.CUSTOMER })
      .withCsrfToken()

    response.assertInertiaPropsContains({
      errors: { role: 'Anda tidak dapat mengubah peran akun Anda sendiri.' },
    })

    await admin.refresh()
    assert.equal(admin.role, Role.ADMIN)
  })

  test('an admin may still rename their own account', async ({ client, assert }) => {
    const admin = await UserFactory.apply('admin').merge({ phone: '081330005002' }).create()

    const response = await client
      .put(`/admin/users/${admin.id}`)
      .loginAs(admin)
      .fields({ name: 'Admin Baru', phone: admin.phone, role: Role.ADMIN })
      .withCsrfToken()

    response.assertRedirectsTo('/admin/users')

    await admin.refresh()
    assert.equal(admin.name, 'Admin Baru')
  })

  /**
   * How somebody stops working here. Their name is attached to every
   * collection, inspection and delivery they ever recorded, and those are the
   * shop's history, so the account cannot be deleted — it is switched off, and
   * stops opening from their very next request.
   */
  test('an account can be deactivated without losing its history', async ({ client, assert }) => {
    const admin = await UserFactory.apply('admin').merge({ phone: '081330009001' }).create()
    const staff = await UserFactory.apply('staff').merge({ phone: '081330009002' }).create()
    const order = await OrderFactory.create()
    await OrderAction.create({
      orderId: order.id,
      staffId: staff.id,
      name: ActionName.PICKUP,
      photoPath: null,
      note: null,
    })

    const response = await client
      .put(`/admin/users/${staff.id}`)
      .loginAs(admin)
      .fields({ name: staff.name, phone: staff.phone, role: Role.STAFF, isActive: 'false' })
      .withCsrfToken()

    response.assertRedirectsTo('/admin/users')

    await staff.refresh()
    assert.isFalse(staff.isActive)

    // The work they did is still attributed to them.
    assert.lengthOf(await OrderAction.query().where('staff_id', staff.id), 1)
  })

  test('a deactivated account can be switched back on', async ({ client, assert }) => {
    const admin = await UserFactory.apply('admin').merge({ phone: '081330010001' }).create()
    const staff = await UserFactory.apply('staff')
      .merge({ phone: '081330010002', isActive: false })
      .create()

    await client
      .put(`/admin/users/${staff.id}`)
      .loginAs(admin)
      .fields({ name: staff.name, phone: staff.phone, role: Role.STAFF, isActive: 'true' })
      .withCsrfToken()

    await staff.refresh()
    assert.isTrue(staff.isActive)
  })

  /**
   * A one-way door out of the admin area, for the same reason demoting
   * yourself is: the next request would be bounced, possibly leaving the shop
   * with nobody who can get back in.
   */
  test('an admin cannot switch off their own account', async ({ client, assert }) => {
    const admin = await UserFactory.apply('admin').merge({ phone: '081330011001' }).create()

    const response = await client
      .put(`/admin/users/${admin.id}`)
      .withInertia()
      .loginAs(admin)
      .header('referer', `/admin/users/${admin.id}/edit`)
      .fields({ name: admin.name, phone: admin.phone, role: Role.ADMIN, isActive: 'false' })
      .withCsrfToken()

    response.assertInertiaPropsContains({
      errors: { isActive: 'Anda tidak dapat menonaktifkan akun Anda sendiri.' },
    })

    await admin.refresh()
    assert.isTrue(admin.isActive)
  })

  test('DELETE /admin/users/:id removes an account with no history', async ({ client, assert }) => {
    const admin = await UserFactory.apply('admin').merge({ phone: '081330006001' }).create()
    const customer = await UserFactory.merge({ phone: '081330006002' }).create()

    const response = await client
      .delete(`/admin/users/${customer.id}`)
      .loginAs(admin)
      .withCsrfToken()

    response.assertRedirectsTo('/admin/users')
    assert.isNull(await User.find(customer.id))
  })

  test('a customer who has ordered cannot be deleted', async ({ client, assert }) => {
    const admin = await UserFactory.apply('admin').merge({ phone: '081330007001' }).create()
    const customer = await UserFactory.merge({ phone: '081330007002' }).create()
    await OrderFactory.merge({ userId: customer.id }).create()

    const response = await client
      .delete(`/admin/users/${customer.id}`)
      .withInertia()
      .loginAs(admin)
      .header('referer', '/admin/users')
      .withCsrfToken()

    response.assertInertiaPropsContains({
      errors: { id: 'Akun ini sudah memiliki riwayat pesanan dan tidak dapat dihapus.' },
    })

    assert.isNotNull(await User.find(customer.id))
  })

  test('a staff member who has worked cannot be deleted', async ({ client, assert }) => {
    const admin = await UserFactory.apply('admin').merge({ phone: '081330007003' }).create()
    const staff = await UserFactory.apply('staff').merge({ phone: '081330007004' }).create()
    const order = await OrderFactory.create()

    await OrderAction.create({
      orderId: order.id,
      staffId: staff.id,
      name: ActionName.PICKUP,
      photoPath: null,
      note: null,
    })

    const response = await client
      .delete(`/admin/users/${staff.id}`)
      .withInertia()
      .loginAs(admin)
      .header('referer', '/admin/users')
      .withCsrfToken()

    response.assertInertiaPropsContains({
      errors: { id: 'Akun ini sudah memiliki riwayat pesanan dan tidak dapat dihapus.' },
    })

    assert.isNotNull(await User.find(staff.id))
  })

  test('an admin cannot delete their own account', async ({ client, assert }) => {
    const admin = await UserFactory.apply('admin').merge({ phone: '081330008001' }).create()

    const response = await client
      .delete(`/admin/users/${admin.id}`)
      .withInertia()
      .loginAs(admin)
      .header('referer', '/admin/users')
      .withCsrfToken()

    response.assertInertiaPropsContains({
      errors: { id: 'Anda tidak dapat menghapus akun Anda sendiri.' },
    })

    assert.isNotNull(await User.find(admin.id))
  })

  test('the list marks which accounts can no longer be deleted', async ({ client, assert }) => {
    const admin = await UserFactory.apply('admin').merge({ phone: '081330009001' }).create()
    const withHistory = await UserFactory.merge({ phone: '081330009002' }).create()
    const fresh = await UserFactory.merge({ phone: '081330009003' }).create()
    await OrderFactory.merge({ userId: withHistory.id }).create()

    const response = await client.get('/admin/users').withInertia().loginAs(admin)

    assert.include(response.inertiaProps.undeletableIds, withHistory.id)
    assert.notInclude(response.inertiaProps.undeletableIds, fresh.id)
  })

  test('the edit page flags the admin editing themselves', async ({ client, assert }) => {
    const admin = await UserFactory.apply('admin').merge({ phone: '081330010001' }).create()
    const other = await UserFactory.merge({ phone: '081330010002' }).create()

    const own = await client.get(`/admin/users/${admin.id}/edit`).withInertia().loginAs(admin)
    assert.isTrue(own.inertiaProps.isSelf)

    const someone = await client.get(`/admin/users/${other.id}/edit`).withInertia().loginAs(admin)
    assert.isFalse(someone.inertiaProps.isSelf)
  })

  test('staff cannot reach user management', async ({ client }) => {
    const staff = await UserFactory.apply('staff').merge({ phone: '081330011001' }).create()

    const response = await client.get('/admin/users').withInertia().loginAs(staff)

    response.assertRedirectsTo('/staff/trips')
  })
})
