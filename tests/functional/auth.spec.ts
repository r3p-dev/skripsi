import { appUrl } from '#config/app'
import { UserFactory } from '#database/factories/user_factory'
import User from '#models/user'
import testUtils from '@adonisjs/core/services/test_utils'
import { signedUrlFor } from '@adonisjs/core/services/url_builder'
import { test } from '@japa/runner'

test.group('Login', (group) => {
  group.each.setup(() => testUtils.db().truncate())

  test('POST /login returns validation errors for invalid payload', async ({ client }) => {
    const response = await client
      .post('/login')
      .withInertia()
      .header('referer', '/login')
      .json({
        phone: 'invalid-phone',
        password: 'longbutnonumber',
        rememberMe: 82,
      })
      .withCsrfToken()

    response.assertInertiaPropsContains({
      errors: {
        phone: 'Nomor telepon harus berupa nomor HP Indonesia yang valid',
        password: 'Kata sandi harus berisi huruf serta angka',
        rememberMe: 'Ingat saya harus berupa nilai benar atau salah',
      },
      flash: {},
    })
  })

  test('POST /login returns validation errors for invalid credentials', async ({ client }) => {
    const user = await UserFactory.create()

    const response = await client
      .post('/login')
      .withInertia()
      .header('referer', '/login')
      .json({
        phone: user.phone,
        password: 'password321',
        rememberMe: true,
      })
      .withCsrfToken()

    response.assertInertiaPropsContains({
      errors: {
        phone: 'Nomor telepon atau kata sandi salah.',
        password: 'Nomor telepon atau kata sandi salah.',
      },
      flash: {},
    })
  })

  test('POST /login returns rate limit error for too many failed login attempts', async ({
    client,
  }) => {
    const user = await UserFactory.create()

    for (let i = 0; i < 5; i++) {
      await client
        .post('/login')
        .withInertia()
        .header('referer', '/login')
        .json({
          phone: user.phone,
          password: 'password321',
          rememberMe: true,
        })
        .withCsrfToken()
    }

    const response = await client
      .post('/login')
      .withInertia()
      .header('referer', '/login')
      .json({
        phone: user.phone,
        password: 'password321',
        rememberMe: true,
      })
      .withCsrfToken()

    response.assertInertiaPropsContains({
      errors: {
        form: 'Terlalu banyak percobaan masuk. Silakan coba lagi nanti.',
      },
      flash: {},
    })
  })
})

test.group('Signup', (group) => {
  group.each.setup(() => testUtils.db().truncate())

  test('POST /signup returns validation errors for invalid payload', async ({ client }) => {
    const response = await client
      .post('/signup')
      .withInertia()
      .header('referer', '/signup')
      .json({
        phone: 'invalid-phone',
        name: 'Invalid Name #3_',
        password: 'password123',
        passwordConfirmation: 'password321',
      })
      .withCsrfToken()

    response.assertInertiaPropsContains({
      errors: {
        phone: 'Nomor telepon harus berupa nomor HP Indonesia yang valid',
        name: 'Nama lengkap hanya boleh berisi huruf',
        passwordConfirmation: 'Konfirmasi kata sandi tidak cocok',
      },
      flash: {},
    })
  })

  test('POST /signup returns validation errors for duplicate phone', async ({ client }) => {
    await UserFactory.create()

    const response = await client
      .post('/signup')
      .withInertia()
      .header('referer', '/signup')
      .json({
        phone: '081387882973',
        name: 'Valid Name',
        password: 'password123',
        passwordConfirmation: 'password123',
      })
      .withCsrfToken()

    response.assertInertiaPropsContains({
      errors: {
        phone: 'Nomor telepon sudah digunakan',
      },
      flash: {},
    })
  })

  test('POST /signup returns rate limit error for too many signup attempts', async ({ client }) => {
    for (let i = 0; i < 10; i++) {
      await client
        .post('/signup')
        .header('referer', '/signup')
        .json({
          phone: `08138788297${i}`,
          name: 'Valid Name',
          password: 'password123',
          passwordConfirmation: 'password123',
        })
        .withCsrfToken()
      const user = await User.findByOrFail('phone', `08138788297${i}`)

      await client.visit('session.destroy').loginAs(user).withCsrfToken()
    }

    const response = await client
      .post('/signup')
      .withInertia()
      .header('referer', '/signup')
      .json({
        phone: '081387882990',
        name: 'Valid Name',
        password: 'password123',
        passwordConfirmation: 'password123',
      })
      .withCsrfToken()

    response.assertInertiaPropsContains({
      errors: {
        form: 'Terlalu banyak percobaan pendaftaran. Silakan coba lagi nanti.',
      },
      flash: {},
    })
  })
})

test.group('Forgot Password', (group) => {
  group.each.setup(() => testUtils.db().truncate())

  test('POST /forgot-password returns validation errors for invalid payload', async ({
    client,
  }) => {
    const response = await client
      .post('/forgot-password')
      .withInertia()
      .header('referer', '/forgot-password')
      .json({
        phone: 'invalid-phone',
      })
      .withCsrfToken()

    response.assertInertiaPropsContains({
      errors: {
        phone: 'Nomor telepon harus berupa nomor HP Indonesia yang valid',
      },
      flash: {},
    })
  })

  test('POST /forgot-password returns rate limit error for too many forgot password attempts', async ({
    client,
  }) => {
    for (let i = 0; i < 5; i++) {
      await client
        .post('/forgot-password')
        .withInertia()
        .header('referer', '/forgot-password')
        .json({
          phone: '081387882973',
        })
        .withCsrfToken()
    }

    const response = await client
      .post('/forgot-password')
      .withInertia()
      .header('referer', '/forgot-password')
      .json({
        phone: '081387882973',
      })
      .withCsrfToken()

    response.assertInertiaPropsContains({
      errors: {
        form: 'Terlalu banyak percobaan permintaan tautan atur ulang kata sandi. Silakan coba lagi nanti.',
      },
      flash: {},
    })
  })
})

test.group('Reset Password', (group) => {
  group.each.setup(() => testUtils.db().truncate())

  test('POST /reset-password returns validation errors for invalid payload', async ({ client }) => {
    const user = await UserFactory.create()

    const resetUrl = signedUrlFor(
      'password_reset.update',
      {},
      {
        qs: {
          phone: user.phone,
        },
        expiresIn: '15m',
        prefixUrl: appUrl,
      }
    )

    const response = await client
      .post(resetUrl)
      .withInertia()
      .header('referer', resetUrl)
      .json({
        password: 'password123',
        passwordConfirmation: 'password456',
      })
      .withCsrfToken()

    response.assertInertiaPropsContains({
      errors: {
        passwordConfirmation: 'Konfirmasi kata sandi tidak cocok',
      },
      flash: {},
    })
  })

  test('POST /reset-password returns rate limit error for too many reset password attempts', async ({
    client,
  }) => {
    const user = await UserFactory.create()

    const resetUrl = signedUrlFor(
      'password_reset.update',
      {},
      {
        qs: {
          phone: user.phone,
        },
        expiresIn: '15m',
        prefixUrl: appUrl,
      }
    )

    for (let i = 0; i < 5; i++) {
      await client
        .post(resetUrl)
        .withInertia()
        .header('referer', resetUrl)
        .json({
          password: 'password123',
          passwordConfirmation: 'password123',
        })
        .withCsrfToken()
    }

    const response = await client
      .post(resetUrl)
      .withInertia()
      .header('referer', resetUrl)
      .json({
        password: 'password123',
        passwordConfirmation: 'password123',
      })
      .withCsrfToken()

    response.assertInertiaPropsContains({
      errors: {
        form: 'Terlalu banyak percobaan atur ulang kata sandi. Silakan coba lagi nanti.',
      },
      flash: {},
    })
  })
})
