import { test } from '@japa/runner'
import FonnteService from '#services/fonnte_service'
import User from '#models/user'
import app from '@adonisjs/core/services/app'
import testUtils from '@adonisjs/core/services/test_utils'
import { FakeFonnteService } from '#tests/utils/fakes'
import { UserFactory } from '#database/factories/user_factory'
import { inputErrors, toRelativeUrl } from '#tests/utils/helpers'

test.group('Admin profile | the page', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  test('an admin can see their own profile', async ({ client }) => {
    const admin = await UserFactory.apply('admin').create()

    const response = await client.get('/admin/profile').loginAs(admin).withInertia()

    response.assertStatus(200)
    response.assertInertiaComponent('admin/profile/show')
  })

  test('a customer is turned away', async ({ client }) => {
    const customer = await UserFactory.create()

    const response = await client.get('/admin/profile').loginAs(customer).redirects(0)

    response.assertStatus(302)
    response.assertHeader('location', '/profile')
  })

  test('a member of staff is turned away', async ({ client }) => {
    const staff = await UserFactory.apply('staff').create()

    const response = await client.get('/admin/profile').loginAs(staff).redirects(0)

    response.assertStatus(302)
    response.assertHeader('location', '/staff/profile')
  })

  test('a guest is sent to sign in', async ({ client }) => {
    const response = await client.get('/admin/profile').redirects(0)

    response.assertStatus(302)
    response.assertHeader('location', '/login')
  })
})

test.group('Admin profile | changing name', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  test('the new name is saved', async ({ client, assert }) => {
    const admin = await UserFactory.apply('admin').create()

    const response = await client
      .put('/admin/profile')
      .loginAs(admin)
      .withCsrfToken()
      .redirects(0)
      .form({ name: 'Admin Baru' })

    response.assertStatus(302)
    response.assertHeader('location', '/admin/profile')

    const stored = await User.findOrFail(admin.id)

    assert.equal(stored.name, 'Admin Baru')
  })

  test('a name with digits in it is refused', async ({ client, assert }) => {
    const admin = await UserFactory.apply('admin').create()

    const response = await client
      .put('/admin/profile')
      .loginAs(admin)
      .withCsrfToken()
      .redirects(0)
      .form({ name: 'Admin 7' })

    response.assertStatus(302)
    assert.property(inputErrors(response), 'name')
  })

  test('a member of staff cannot rename an admin', async ({ client }) => {
    const staff = await UserFactory.apply('staff').create()

    const response = await client
      .put('/admin/profile')
      .loginAs(staff)
      .withCsrfToken()
      .redirects(0)
      .form({ name: 'Penyusup' })

    response.assertStatus(302)
    response.assertHeader('location', '/staff/profile')
  })
})

test.group('Admin profile | changing phone number', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())
  group.each.teardown(() => app.container.restoreAll())

  test('the verification link points at the admin route', async ({ client, assert }) => {
    const fonnte = new FakeFonnteService()

    app.container.swap(FonnteService, () => fonnte)

    const admin = await UserFactory.apply('admin').create()

    const response = await client
      .post('/admin/phone')
      .loginAs(admin)
      .withCsrfToken()
      .redirects(0)
      .form({ phone: '081200000751' })

    response.assertStatus(302)
    assert.include(fonnte.lastMessage!.body, '/admin/phone/verify')
  })

  test('following the link swaps the number over', async ({ client, assert }) => {
    const fonnte = new FakeFonnteService()

    app.container.swap(FonnteService, () => fonnte)

    const admin = await UserFactory.apply('admin').create()

    await client
      .post('/admin/phone')
      .loginAs(admin)
      .withCsrfToken()
      .redirects(0)
      .form({ phone: '081200000752' })

    const response = await client
      .get(toRelativeUrl(fonnte.lastMessage!.body))
      .loginAs(admin)
      .redirects(0)

    response.assertStatus(302)

    const stored = await User.findOrFail(admin.id)

    assert.equal(stored.phone, '081200000752')
  })

  test('an admin cannot claim a number another account holds', async ({ client, assert }) => {
    const fonnte = new FakeFonnteService()

    app.container.swap(FonnteService, () => fonnte)

    const admin = await UserFactory.apply('admin').create()
    const other = await UserFactory.create()

    const response = await client
      .post('/admin/phone')
      .loginAs(admin)
      .withCsrfToken()
      .redirects(0)
      .form({ phone: other.phone })

    response.assertStatus(302)
    assert.property(inputErrors(response), 'phone')
    assert.isEmpty(fonnte.messages)
  })
})
