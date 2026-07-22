import { appUrl } from '#config/app'
import { createUser } from '#tests/utils/helpers'
import testUtils from '@adonisjs/core/services/test_utils'
import { signedUrlFor } from '@adonisjs/core/services/url_builder'
import { test } from '@japa/runner'

test.group('GET pages', (group) => {
  group.each.setup(() => {
    return testUtils.db().truncate()
  })

  test('GET /login returns auth/login component for guests', async ({ client }) => {
    const response = await client.visit('session.create').withInertia()

    response.assertInertiaComponent('auth/login')
  })

  test('GET /register returns auth/signup component for guests', async ({ client }) => {
    const response = await client.visit('signup.create').withInertia()

    response.assertInertiaComponent('auth/signup')
  })

  test('GET /forgot-password returns auth/forgot_password component for guests', async ({
    client,
  }) => {
    const response = await client.visit('password_reset.create').withInertia()

    response.assertInertiaComponent('auth/forgot_password')
  })

  test('GET /reset-password returns auth/reset_password component for guests', async ({
    client,
  }) => {
    const user = await createUser()
    const resetUrl = signedUrlFor(
      'password_reset.edit',
      {},
      {
        qs: {
          phone: user.phone,
        },
        expiresIn: '15m',
        prefixUrl: appUrl,
      }
    )

    const response = await client.get(resetUrl).withInertia()

    response.assertInertiaComponent('auth/reset_password')
  })

  test('GET /login redirects to /order when already logged in', async ({ client }) => {
    const user = await createUser()

    const response = await client.visit('session.create').withInertia().loginAs(user)

    response.assertRedirectsTo('/orders/create')
    response.assertInertiaComponent('customer/order/create')
  })

  test('GET /register redirects to /order when already logged in', async ({ client }) => {
    const user = await createUser()

    const response = await client.visit('signup.create').withInertia().loginAs(user)

    response.assertRedirectsTo('/orders/create')
    response.assertInertiaComponent('customer/order/create')
  })

  test('GET /forgot-password redirects to /order when already logged in', async ({ client }) => {
    const user = await createUser()

    const response = await client.visit('password_reset.create').withInertia().loginAs(user)

    response.assertRedirectsTo('/orders/create')
    response.assertInertiaComponent('customer/order/create')
  })

  test('GET /reset-password redirects to /order when already logged in', async ({ client }) => {
    const user = await createUser()

    const response = await client
      .visit('password_reset.edit')
      .qs({ phone: '081387882973', signature: 'somesignature' })
      .withInertia()
      .loginAs(user)

    response.assertRedirectsTo('/orders/create')
    response.assertInertiaComponent('customer/order/create')
  })
})

test.group('Validation errors', (group) => {
  group.each.setup(() => {
    return testUtils.db().truncate()
  })

  test('POST /login returns validation errors for invalid phone', async ({ client }) => {
    const response = await client
      .post('/login')
      .withInertia()
      .header('referer', '/login')
      .json({
        phone: 'invalid-phone',
        password: 'password123',
        rememberMe: false,
      })
      .withCsrfToken()

    response.assertInertiaPropsContains({
      errors: {
        phone: 'Nomor telepon harus berupa nomor HP Indonesia yang valid',
      },
      flash: {},
    })
  })

  test('POST /login returns validation errors for invalid short password', async ({ client }) => {
    const response = await client
      .post('/login')
      .withInertia()
      .header('referer', '/login')
      .json({
        phone: '081387882973',
        password: 'short',
        rememberMe: false,
      })
      .withCsrfToken()

    response.assertInertiaPropsContains({
      errors: {
        password: 'Kata sandi minimal 8 karakter',
      },
      flash: {},
    })
  })

  test('POST /login returns validation errors for invalid regex password', async ({ client }) => {
    const response = await client
      .post('/login')
      .withInertia()
      .header('referer', '/login')
      .json({
        phone: '081387882973',
        password: 'longbutnonumber',
        rememberMe: false,
      })
      .withCsrfToken()

    response.assertInertiaPropsContains({
      errors: {
        password: 'Kata sandi harus berisi huruf serta angka',
      },
      flash: {},
    })
  })

  test('POST /login returns validation errors for invalid long password', async ({ client }) => {
    const response = await client
      .post('/login')
      .withInertia()
      .header('referer', '/login')
      .json({
        phone: '081387882973',
        password: 'veryverylongpassword1234',
        rememberMe: false,
      })
      .withCsrfToken()

    response.assertInertiaPropsContains({
      errors: {
        password: 'Kata sandi maksimal 16 karakter',
      },
      flash: {},
    })
  })

  test('POST /login returns validation errors for invalid remember me', async ({ client }) => {
    const user = await createUser()

    const response = await client
      .post('/login')
      .withInertia()
      .header('referer', '/login')
      .json({
        phone: user.phone,
        password: 'password123',
        rememberMe: 82,
      })
      .withCsrfToken()

    response.dump()
    response.assertInertiaPropsContains({
      errors: {
        rememberMe: 'Ingat saya harus berupa nilai benar atau salah',
      },
      flash: {},
    })
  })

  test('POST /register returns validation errors for invalid phone', async ({ client }) => {
    const response = await client
      .post('/signup')
      .withInertia()
      .header('referer', '/signup')
      .json({
        phone: 'invalid-phone',
        name: 'Valid Name',
        password: 'password123',
        passwordConfirm: 'password123',
      })
      .withCsrfToken()

    response.assertInertiaPropsContains({
      errors: {
        phone: 'Nomor telepon harus berupa nomor HP Indonesia yang valid',
      },
      flash: {},
    })
  })

  test('POST /register returns validation errors for invalid name', async ({ client }) => {
    const response = await client
      .post('/signup')
      .withInertia()
      .header('referer', '/signup')
      .json({
        phone: '081387882973',
        name: 'Invalid Name #3_',
        password: 'password123',
        passwordConfirm: 'password123',
      })
      .withCsrfToken()

    response.assertInertiaPropsContains({
      errors: {
        name: 'Nama lengkap hanya boleh berisi huruf',
      },
      flash: {},
    })
  })

  test('POST /register returns validation errors for invalid short password', async ({
    client,
  }) => {
    const response = await client
      .post('/signup')
      .withInertia()
      .header('referer', '/signup')
      .json({
        phone: '081387882973',
        name: 'Valid Name',
        password: 'short',
        passwordConfirm: 'short',
      })
      .withCsrfToken()

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
      .withInertia()
      .header('referer', '/signup')
      .json({
        phone: '081387882973',
        name: 'Valid Name',
        password: 'longbutnonumber',
        passwordConfirm: 'longbutnonumber',
      })
      .withCsrfToken()

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
      .withInertia()
      .header('referer', '/signup')
      .json({
        phone: '081387882973',
        name: 'Valid Name',
        password: 'veryverylongpassword1234',
        passwordConfirm: 'veryverylongpassword1234',
      })
      .withCsrfToken()

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
      .withInertia()
      .header('referer', '/signup')
      .json({
        phone: '081387882973',
        name: 'Valid Name',
        password: 'password123',
        passwordConfirm: 'password456',
      })
      .withCsrfToken()

    response.assertInertiaPropsContains({
      errors: {
        passwordConfirm: 'Konfirmasi kata sandi tidak cocok',
      },
      flash: {},
    })
  })

  test('POST /register returns validation errors for duplicate phone', async ({ client }) => {
    await createUser()

    const response = await client
      .post('/signup')
      .withInertia()
      .header('referer', '/signup')
      .json({
        phone: '081387882973',
        name: 'Valid Name',
        password: 'password123',
        passwordConfirm: 'password123',
      })
      .withCsrfToken()

    response.headers()
    response.assertInertiaPropsContains({
      errors: {
        phone: 'Nomor telepon sudah digunakan',
      },
      flash: {},
    })
  })

  test('POST /forgot-password returns validation errors for invalid phone', async ({ client }) => {
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

  test('GET /reset-password returns validation errors for invalid signed url', async ({
    client,
  }) => {
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
      .withInertia()
      .header('referer', resetUrl)
      .json({
        password: 'short',
        passwordConfirm: 'short',
      })
      .withCsrfToken()

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
      .withInertia()
      .header('referer', resetUrl)
      .json({
        password: 'longbutnonumber',
        passwordConfirm: 'longbutnonumber',
      })
      .withCsrfToken()

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
      .withInertia()
      .header('referer', resetUrl)
      .json({
        password: 'veryverylongpassword1234',
        passwordConfirm: 'veryverylongpassword1234',
      })
      .withCsrfToken()

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
      .withInertia()
      .header('referer', resetUrl)
      .json({
        password: 'password123',
        passwordConfirm: 'password456',
      })
      .withCsrfToken()

    response.assertInertiaPropsContains({
      errors: {
        passwordConfirm: 'Konfirmasi kata sandi tidak cocok',
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
    await createUser()

    const response = await client
      .post('/login')
      .withInertia()
      .json({
        phone: '081387882973',
        password: 'password123',
        rememberMe: false,
      })
      .withCsrfToken()

    response.assertRedirectsTo('/orders/create')
  })

  test('POST /signup succeeds and redirect to user /address page', async ({ client, db }) => {
    const response = await client
      .post('/signup')
      .withInertia()
      .json({
        name: 'Valid Name',
        phone: '081387882973',
        password: 'password123',
        passwordConfirm: 'password123',
      })
      .withCsrfToken()

    await db.assertHas('users', { phone: '081387882973' })
    response.assertRedirectsTo('/address')
  })

  test('POST /forgot-password succeeds and send whatsapp OTP', async ({ client }) => {
    const user = await createUser()

    const response = await client
      .post('/forgot-password')
      .withInertia()
      .json({
        phone: user.phone,
      })
      .withCsrfToken()

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
      .withInertia()
      .header('referer', resetUrl)
      .json({
        password: 'password123',
        passwordConfirm: 'password123',
      })
      .withCsrfToken()

    response.assertRedirectsTo('/login')
  })
})
