import { UserFactory } from '#database/factories/user_factory'
import { Role } from '#enums/role_enum'
import User from '#models/user'
import testUtils from '@adonisjs/core/services/test_utils'
import { test } from '@japa/runner'

const signupPayload = {
  name: 'Petugas Baru',
  phone: '081399990002',
  password: 'password123',
  passwordConfirmation: 'password123',
  role: Role.STAFF,
}

/**
 * Registration for the people who work here.
 *
 * The public sign-up form only ever produces customers, deliberately: a form
 * anyone on the internet can reach must not be able to mint an account that
 * reads the shop's takings. So this is the only route into a staff or admin
 * account, and it sits behind the admin area.
 */
test.group('Admin staff sign-up', (group) => {
  group.each.setup(() => testUtils.db().truncate())

  test('an admin can register a staff account', async ({ client, assert }) => {
    const admin = await UserFactory.apply('admin').merge({ phone: '081399990001' }).create()

    const response = await client
      .post('/admin/signup')
      .loginAs(admin)
      .json(signupPayload)
      .withCsrfToken()

    response.assertRedirectsTo('/admin/users')

    const created = await User.findByOrFail('phone', '081399990002')
    assert.equal(created.role, Role.STAFF)
    assert.isTrue(created.isActive)
  })

  test('an admin can register another admin', async ({ client, assert }) => {
    const admin = await UserFactory.apply('admin').merge({ phone: '081399991001' }).create()

    await client
      .post('/admin/signup')
      .loginAs(admin)
      .json({ ...signupPayload, phone: '081399991002', role: Role.ADMIN })
      .withCsrfToken()

    const created = await User.findByOrFail('phone', '081399991002')
    assert.equal(created.role, Role.ADMIN)
  })

  /**
   * A customer signs themselves up on the public form. There is no reason for
   * this one to be able to mint one, and every reason for its role list to be
   * exactly the two roles it exists to create.
   */
  test('the form refuses to create a customer', async ({ client, assert }) => {
    const admin = await UserFactory.apply('admin').merge({ phone: '081399992001' }).create()

    const response = await client
      .post('/admin/signup')
      .withInertia()
      .loginAs(admin)
      .header('referer', '/admin/signup')
      .json({ ...signupPayload, phone: '081399992002', role: Role.CUSTOMER })
      .withCsrfToken()

    response.assertInertiaPropsContains({
      errors: { role: 'Peran yang dipilih tidak valid' },
    })

    assert.isNull(await User.findBy('phone', '081399992002'))
  })

  test('a staff member cannot register anybody', async ({ client, assert }) => {
    const staff = await UserFactory.apply('staff').merge({ phone: '081399993001' }).create()

    const response = await client
      .post('/admin/signup')
      .loginAs(staff)
      .json({ ...signupPayload, phone: '081399993002' })
      .withCsrfToken()

    response.assertRedirectsTo('/staff/trips')
    assert.isNull(await User.findBy('phone', '081399993002'))
  })

  test('a customer cannot register anybody', async ({ client, assert }) => {
    const customer = await UserFactory.merge({ phone: '081399994001' }).create()

    const response = await client
      .post('/admin/signup')
      .loginAs(customer)
      .json({ ...signupPayload, phone: '081399994002' })
      .withCsrfToken()

    response.assertRedirectsTo('/order')
    assert.isNull(await User.findBy('phone', '081399994002'))
  })

  test('a guest cannot register anybody', async ({ client, assert }) => {
    const response = await client
      .post('/admin/signup')
      .json({ ...signupPayload, phone: '081399995002' })
      .withCsrfToken()

    response.assertRedirectsTo('/login')
    assert.isNull(await User.findBy('phone', '081399995002'))
  })

  /**
   * The public form is the counterpart to this one, and it must stay incapable
   * of producing anything but a customer however the payload is dressed up.
   */
  test('the public form still only makes customers', async ({ client, assert }) => {
    await client
      .post('/signup')
      .json({
        name: 'Penyusup',
        phone: '081399996001',
        password: 'password123',
        passwordConfirmation: 'password123',
        role: Role.ADMIN,
      })
      .withCsrfToken()

    const created = await User.findByOrFail('phone', '081399996001')
    assert.equal(created.role, Role.CUSTOMER)
  })
})
