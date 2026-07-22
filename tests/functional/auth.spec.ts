import { appUrl } from '#config/app'
import { createUser } from '#tests/utils/helpers'
import testUtils from '@adonisjs/core/services/test_utils'
import { signedUrlFor } from '@adonisjs/core/services/url_builder'
import { test } from '@japa/runner'

test.group('GET pages', (group) => {
  group.each.setup(() => {
    return testUtils.db().truncate()
  })

  test('GET /login returns auth/login for guests', async ({ client }) => {
    const response = await client.visit('session.create').withInertia()

    response.assertInertiaComponent('auth/login')
  })

  test('GET /register returns auth/signup for guests', async ({ client }) => {
    const response = await client.visit('signup.create').withInertia()

    response.assertInertiaComponent('auth/signup')
  })

  test('GET /forgot-password returns auth/forgot_password for guests', async ({ client }) => {
    const response = await client.visit('password_reset.create').withInertia()

    response.assertInertiaComponent('auth/forgot_password')
  })

  test('GET /login redirects to /order when already logged in', async ({ client }) => {
    const user = await createUser()

    const response = await client.visit('session.create').loginAs(user).withInertia()

    response.assertInertiaComponent('customer/order/create')
  })

  test('GET /register redirects to /order when already logged in', async ({ client }) => {
    const user = await createUser()

    const response = await client.visit('signup.create').loginAs(user).withInertia()

    response.assertInertiaComponent('customer/order/create')
  })

  test('GET /forgot-password redirects to /order when already logged in', async ({ client }) => {
    const user = await createUser()

    const response = await client.visit('password_reset.create').loginAs(user).withInertia()

    response.assertInertiaComponent('customer/order/create')
  })

  test('GET /reset-password redirects to /order when already logged in', async ({ client }) => {
    const user = await createUser()

    const response = await client
      .visit('password_reset.edit')
      .qs({ phone: '081387882973', signature: 'somesignature' })
      .loginAs(user)
      .withInertia()

    response.assertInertiaComponent('customer/order/create')
  })
})

test.group('Validation errors', (group) => {
  group.each.setup(() => {
    return testUtils.db().truncate()
  })

  test('POST /login returns validation errors for invalid phone', async ({ client }) => {
    const response = await client
      .visit('session.store')
      .header('referer', '/login')
      .json({
        phone: 'invalid-phone',
        password: 'short',
        rememberMe: false,
      })
      .withCsrfToken()
      .withInertia()

    response.assertInertiaPropsContains({
      errors: {
        phone: 'Nomor Telepon harus berupa nomor HP Indonesia yang valid',
      },
      flash: {},
    })
  })

  test('POST /login returns validation errors for invalid short password', async ({ client }) => {
    const response = await client
      .visit('session.store')
      .header('referer', '/login')
      .json({
        phone: '6281387882973',
        password: 'short',
        rememberMe: false,
      })
      .withCsrfToken()
      .withInertia()

    response.assertInertiaPropsContains({
      errors: {
        password: 'Kata sandi minimal 8 karakter',
      },
      flash: {},
    })
  })

  test('POST /login returns validation errors for invalid regex password', async ({ client }) => {
    const response = await client
      .visit('session.store')
      .header('referer', '/login')
      .json({
        phone: '6281387882973',
        password: 'longbutnonumber',
        rememberMe: false,
      })
      .withCsrfToken()
      .withInertia()

    response.assertInertiaPropsContains({
      errors: {
        password: 'Kata sandi harus berisi huruf serta angka',
      },
      flash: {},
    })
  })

  test('POST /login returns validation errors for invalid long password', async ({ client }) => {
    const response = await client
      .visit('session.store')
      .header('referer', '/login')
      .json({
        phone: '6281387882973',
        password: 'veryverylongpassword1234',
        rememberMe: false,
      })
      .withCsrfToken()
      .withInertia()

    response.assertInertiaPropsContains({
      errors: {
        password: 'Kata sandi maksimal 16 karakter',
      },
      flash: {},
    })
  })

  test('POST /register returns validation errors for invalid phone', async ({ client }) => {
    const response = await client
      .post('/signup')
      .header('referer', '/signup')
      .json({
        phone: 'invalid-phone',
        name: 'Valid Name',
        password: 'password123',
        password_confirmation: 'password123',
      })
      .withCsrfToken()
      .withInertia()

    response.assertInertiaPropsContains({
      errors: {
        phone: 'Nomor Telepon harus berupa nomor HP Indonesia yang valid',
      },
      flash: {},
    })
  })

  test('POST /register returns validation errors for invalid name', async ({ client }) => {
    const response = await client
      .post('/signup')
      .header('referer', '/signup')
      .json({
        phone: '6281387882973',
        name: 'Invalid Name #3_',
        password: 'password123',
        password_confirmation: 'password123',
      })
      .withCsrfToken()
      .withInertia()

    response.assertInertiaPropsContains({
      errors: {
        name: 'Nama Lengkap hanya boleh berisi huruf',
      },
      flash: {},
    })
  })

  test('POST /register returns validation errors for invalid short password', async ({
    client,
  }) => {
    const response = await client
      .post('/signup')
      .header('referer', '/signup')
      .json({
        phone: '6281387882973',
        name: 'Valid Name',
        password: 'short',
        password_confirmation: 'short',
      })
      .withCsrfToken()
      .withInertia()

    response.assertInertiaPropsContains({
      errors: {
        password: 'Kata sandi minimal 8 karakter',
      },
      flash: {},
    })
  })

  test('POST /register returns validation errors for invalid regex password', async ({
    client,
  }) => {
    const response = await client
      .post('/signup')
      .header('referer', '/signup')
      .json({
        phone: '6281387882973',
        name: 'Valid Name',
        password: 'longbutnonumber',
        password_confirmation: 'longbutnonumber',
      })
      .withCsrfToken()
      .withInertia()

    response.assertInertiaPropsContains({
      errors: {
        password: 'Kata sandi harus berisi huruf serta angka',
      },
      flash: {},
    })
  })

  test('POST /register returns validation errors for invalid long password', async ({ client }) => {
    const response = await client
      .post('/signup')
      .header('referer', '/signup')
      .json({
        phone: '6281387882973',
        name: 'Valid Name',
        password: 'veryverylongpassword1234',
        password_confirmation: 'veryverylongpassword1234',
      })
      .withCsrfToken()
      .withInertia()

    response.assertInertiaPropsContains({
      errors: {
        password: 'Kata sandi maksimal 16 karakter',
      },
      flash: {},
    })
  })

  test('POST /register returns validation errors for invalid different passwords', async ({
    client,
  }) => {
    const response = await client
      .post('/signup')
      .header('referer', '/signup')
      .json({
        phone: '6281387882973',
        name: 'Valid Name',
        password: 'password123',
        password_confirmation: 'password456',
      })
      .withCsrfToken()
      .withInertia()

    response.assertInertiaPropsContains({
      errors: {
        password_confirmation: 'Konfirmasi kata sandi tidak cocok',
      },
      flash: {},
    })
  })

  test('POST /forgot-password returns validation errors for invalid phone', async ({ client }) => {
    const response = await client
      .post('/forgot-password')
      .header('referer', '/forgot-password')
      .json({
        phone: 'invalid-phone',
      })
      .withCsrfToken()
      .withInertia()

    response.assertInertiaPropsContains({
      errors: {
        phone: 'Nomor Telepon harus berupa nomor HP Indonesia yang valid',
      },
      flash: {},
    })
  })

  test('POST /forgot-password returns validation errors for invalid signed url', async ({
    client,
  }) => {
    const user = await createUser()
    await client
      .post('/forgot-password')
      .json({
        phone: user.phone,
      })
      .withCsrfToken()
      .withInertia()

    const response = await client.visit('password_reset.edit').withInertia()
    response.assertInertiaComponent('errors/not_found')
  })

  test('POST /reset-password returns validation errors for invalid short password', async ({
    client,
  }) => {
    const user = await createUser()

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
      .header('referer', resetUrl)
      .json({
        password: 'short',
        password_confirmation: 'short',
      })
      .withCsrfToken()
      .withInertia()

    response.assertInertiaPropsContains({
      errors: {
        password: 'Kata sandi minimal 8 karakter',
      },
      flash: {},
    })
  })

  test('POST /reset-password returns validation errors for invalid regex password', async ({
    client,
  }) => {
    const user = await createUser()

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
      .header('referer', resetUrl)
      .json({
        password: 'longbutnonumber',
        password_confirmation: 'longbutnonumber',
      })
      .withCsrfToken()
      .withInertia()

    response.assertInertiaPropsContains({
      errors: {
        password: 'Kata sandi harus berisi huruf serta angka',
      },
      flash: {},
    })
  })

  test('POST /reset-password returns validation errors for invalid long password', async ({
    client,
  }) => {
    const user = await createUser()

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
      .header('referer', resetUrl)
      .json({
        password: 'veryverylongpassword1234',
        password_confirmation: 'veryverylongpassword1234',
      })
      .withCsrfToken()
      .withInertia()

    response.assertInertiaPropsContains({
      errors: {
        password: 'Kata sandi maksimal 16 karakter',
      },
      flash: {},
    })
  })

  test('POST /reset-password returns validation errors for invalid different passwords', async ({
    client,
  }) => {
    const user = await createUser()

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
      .header('referer', resetUrl)
      .json({
        password: 'password123',
        password_confirmation: 'password456',
      })
      .withCsrfToken()
      .withInertia()

    response.assertInertiaPropsContains({
      errors: {
        password_confirmation: 'Konfirmasi kata sandi tidak cocok',
      },
      flash: {},
    })
  })
})

test.group('POST succeeds', (group) => {
  group.each.setup(() => {
    return testUtils.db().truncate()
  })

  test('POST /login succeeds and redirects to user /order page', async ({ client }) => {
    await client
      .post('/signup')
      .json({
        name: 'Valid Name',
        phone: '6281387882973',
        password: 'password123',
        password_confirmation: 'password123',
      })
      .withCsrfToken()

    const response = await client
      .visit('session.store')
      .json({
        phone: '6281387882973',
        password: 'password123',
        rememberMe: false,
      })
      .withCsrfToken()
      .withInertia()

    response.assertRedirectsTo('/orders/create')
  })

  test('POST /signup succeeds and redirect to user /address page', async ({ client, db }) => {
    const response = await client
      .post('/signup')
      .json({
        name: 'Valid Name',
        phone: '6281387882973',
        password: 'password123',
        password_confirmation: 'password123',
      })
      .withCsrfToken()

    await db.assertHas('users', { phone: '6281387882973' })
    response.assertRedirectsTo('/address')
  })

  test('POST /forgot-password succeeds and send whatsapp OTP', async ({ client }) => {
    const user = await createUser()

    const response = await client
      .post('/forgot-password')
      .json({
        phone: user.phone,
      })
      .withCsrfToken()
      .withInertia()

    response.assertInertiaPropsContains({
      flash: {
        success:
          'Jika akun dengan nomor telepon tersebut ada, tautan reset kata sandi telah dikirim melalui WhatsApp.',
      },
    })
  })

  test('POST /reset-password succeeds and redirect to login page', async ({ client }) => {
    const user = await createUser()

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
      .header('referer', resetUrl)
      .json({
        password: 'password123',
        password_confirmation: 'password123',
      })
      .withCsrfToken()
      .withInertia()

    response.assertRedirectsTo('/login')
  })
})
