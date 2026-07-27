import { UserFactory } from '#database/factories/user_factory'
import testUtils from '@adonisjs/core/services/test_utils'
import { test } from '@japa/runner'

test.group('Role access boundaries', (group) => {
  group.each.setup(() => testUtils.db().truncate())

  test('a guest visiting a staff route is redirected to login', async ({ client }) => {
    const response = await client.get('/staff/trips').withInertia()

    response.assertRedirectsTo('/login')
  })

  test('a customer visiting a staff route is redirected to their own home', async ({ client }) => {
    const customer = await UserFactory.create()

    const response = await client.get('/staff/trips').withInertia().loginAs(customer)

    response.assertRedirectsTo('/order')
    response.assertInertiaPropsContains({
      flash: { error: 'Anda tidak memiliki akses ke halaman ini' },
    })
  })

  test('a customer visiting an admin route is redirected to their own home', async ({ client }) => {
    const customer = await UserFactory.create()

    const response = await client.get('/admin/dashboard').withInertia().loginAs(customer)

    response.assertRedirectsTo('/order')
  })

  test('staff visiting a customer route is redirected to their own home', async ({ client }) => {
    const staff = await UserFactory.apply('staff').create()

    const response = await client.get('/orders').withInertia().loginAs(staff)

    response.assertRedirectsTo('/staff/trips')
  })

  test('staff visiting an admin route is redirected to their own home', async ({ client }) => {
    const staff = await UserFactory.apply('staff').create()

    const response = await client.get('/admin/dashboard').withInertia().loginAs(staff)

    response.assertRedirectsTo('/staff/trips')
  })

  test('an admin visiting a staff route is redirected to their own home', async ({ client }) => {
    const admin = await UserFactory.apply('admin').create()

    const response = await client.get('/staff/trips').withInertia().loginAs(admin)

    response.assertRedirectsTo('/admin/dashboard')
  })

  test('an admin visiting a customer route is redirected to their own home', async ({ client }) => {
    const admin = await UserFactory.apply('admin').create()

    const response = await client.get('/orders').withInertia().loginAs(admin)

    response.assertRedirectsTo('/admin/dashboard')
  })
})
