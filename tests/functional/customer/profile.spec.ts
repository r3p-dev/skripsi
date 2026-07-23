import { UserFactory } from '#database/factories/user_factory'
import testUtils from '@adonisjs/core/services/test_utils'
import { test } from '@japa/runner'

test.group('GET Pages', (group) => {
  group.each.setup(() => {
    return testUtils.db().truncate()
  })

  test('GET /profile returns customer/profile/show', async ({ client }) => {
    const user = await UserFactory.create()

    const response = await client.visit('customer.profile.show').loginAs(user).withInertia()

    response.assertInertiaComponent('customer/profile')
  })
})

test.group('Validation Errors', (group) => {
  group.each.setup(() => {
    return testUtils.db().truncate()
  })

  test('PUT /profile returns validation errors for invalid short password', async ({ client }) => {
    const user = await UserFactory.create()

    const response = await client
      .put('/profile')
      .withInertia()
      .header('referer', '/profile')
      .json({
        currentPassword: user.password,
        password: 'short',
        passwordConfirm: 'short',
      })
      .loginAs(user)
      .withCsrfToken()

    response.assertInertiaPropsContains({
      errors: {
        password: 'Kata sandi minimal 8 karakter',
      },
      flash: {},
    })
  })

  test('PUT /profile returns validation errors for invalid regex password', async ({ client }) => {
    const user = await UserFactory.create()

    const response = await client
      .put('/profile')
      .withInertia()
      .header('referer', '/profile')
      .json({
        currentPassword: user.password,
        password: 'longbutnonumber',
        passwordConfirm: 'longbutnonumber',
      })
      .loginAs(user)
      .withCsrfToken()

    response.assertInertiaPropsContains({
      errors: {
        password: 'Kata sandi harus berisi huruf serta angka',
      },
      flash: {},
    })
  })

  test('PUT /profile returns validation errors for invalid long password', async ({ client }) => {
    const user = await UserFactory.create()

    const response = await client
      .put('/profile')
      .withInertia()
      .header('referer', '/profile')
      .json({
        currentPassword: user.password,
        password: 'verylongpassword1234',
        passwordConfirm: 'verylongpassword1234',
      })
      .loginAs(user)
      .withCsrfToken()

    response.assertInertiaPropsContains({
      errors: {
        password: 'Kata sandi maksimal 16 karakter',
      },
      flash: {},
    })
  })

  test('PUT /profile returns validation errors for invalid different password', async ({
    client,
  }) => {
    const user = await UserFactory.create()

    const response = await client
      .put('/profile')
      .withInertia()
      .header('referer', '/profile')
      .json({
        currentPassword: user.password,
        password: 'password123',
        passwordConfirm: 'password456',
      })
      .loginAs(user)
      .withCsrfToken()

    response.assertInertiaPropsContains({
      errors: {
        passwordConfirm: 'Konfirmasi kata sandi tidak cocok',
      },
      flash: {},
    })
  })

  test('PUT /profile returns validation errors for invalid current password', async ({
    client,
  }) => {
    const user = await UserFactory.create()

    const response = await client
      .put('/profile')
      .withInertia()
      .header('referer', '/profile')
      .json({
        currentPassword: 'password345',
        password: 'password123',
        passwordConfirm: 'password123',
      })
      .loginAs(user)
      .withCsrfToken()

    response.assertInertiaPropsContains({
      errors: {
        currentPassword: 'Kata sandi saat ini salah',
      },
      flash: {},
    })
  })
})

test.group('PUT succeeds', (group) => {
  group.each.setup(() => {
    return testUtils.db().truncate()
  })

  test('PUT /profile succeeds with valid data', async ({ client }) => {
    const user = await UserFactory.merge({ password: 'password123' }).create()

    const response = await client
      .put('/profile')
      .withInertia()
      .header('referer', '/profile')
      .json({
        currentPassword: 'password123',
        password: 'password345',
        passwordConfirm: 'password345',
      })
      .loginAs(user)
      .withCsrfToken()

    response.assertInertiaPropsContains({
      errors: {},
      flash: {
        success: 'Kata sandi berhasil diperbarui',
      },
    })
  })
})
