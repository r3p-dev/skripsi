import { test } from '@japa/runner'
import testUtils from '@adonisjs/core/services/test_utils'
import { UserFactory } from '#database/factories/user_factory'
import { appUrl } from '#config/app'
import { signedUrlFor } from '@adonisjs/core/services/url_builder'

test.group('Login', (group) => {
  group.each.setup(() => testUtils.db().truncate())

  test('guest can visit login page', async ({ visit, route }) => {
    const page = await visit(route('session.create'))

    await page.assertPath('/login')
    await page.assertTextContains('body', 'Masuk')
  })

  test('user redirected to /order page when visiting login page while logged in', async ({
    visit,
    route,
    browserContext,
  }) => {
    const user = await UserFactory.create()

    await browserContext.loginAs(user)
    const page = await visit(route('session.create'))

    await page.assertPath('/order')
    await page.assertTextContains('body', 'Buat Pesanan')
  })

  test('user can login with valid credentials', async ({ visit, route }) => {
    await UserFactory.create()

    const page = await visit(route('session.create'))

    await page.getByLabel('Nomor Telepon').fill('081387882973')
    await page.getByLabel('Kata Sandi').fill('password123')
    await page.getByRole('button', { name: 'Masuk' }).click()

    await page.assertPath('/order')
    await page.assertTextContains('body', 'Buat Pesanan')
    await page.locator('[data-sonner-toast]').waitFor({ state: 'visible' })
    await page.assertTextContains('[data-sonner-toast]', 'Berhasil masuk.')
  })
})

test.group('Signup', (group) => {
  group.each.setup(() => testUtils.db().truncate())

  test('guest can visit signup page', async ({ visit, route }) => {
    const page = await visit(route('signup.create'))

    await page.assertPath('/signup')
    await page.assertTextContains('body', 'Daftar')
  })

  test('user redirected to /order page when visiting signup page while logged in', async ({
    visit,
    route,
    browserContext,
  }) => {
    const user = await UserFactory.create()

    await browserContext.loginAs(user)
    const page = await visit(route('signup.create'))

    await page.assertPath('/order')
    await page.assertTextContains('body', 'Buat Pesanan')
  })

  test('user can signup with valid credentials', async ({ visit, route }) => {
    const page = await visit(route('signup.create'))

    await page.getByLabel('Nama Lengkap').fill('John Doe')
    await page.getByLabel('Nomor Telepon').fill('081387882973')
    await page.getByLabel('Kata Sandi', { exact: true }).fill('password123')
    await page.getByLabel('Konfirmasi Kata Sandi', { exact: true }).fill('password123')
    await page.getByRole('button', { name: 'Daftar' }).click()

    await page.assertPath('/order')
    await page.assertTextContains('body', 'Buat Pesanan')
    await page.locator('[data-sonner-toast]').waitFor({ state: 'visible' })
    await page.assertTextContains('[data-sonner-toast]', 'Akun berhasil dibuat. Selamat datang!')
  })
})

test.group('Forgot Password', (group) => {
  group.each.setup(() => testUtils.db().truncate())

  test('guest can visit forgot password page', async ({ visit, route }) => {
    const page = await visit(route('password_reset.create'))

    await page.assertPath('/forgot-password')
    await page.assertTextContains('body', 'Lupa Kata Sandi')
  })

  test('user redirected to /order page when visiting forgot password page while logged in', async ({
    visit,
    route,
    browserContext,
  }) => {
    const user = await UserFactory.create()

    await browserContext.loginAs(user)
    const page = await visit(route('password_reset.create'))

    await page.assertPath('/order')
    await page.assertTextContains('body', 'Buat Pesanan')
  })

  test('user can request password reset with valid phone number', async ({ visit, route }) => {
    await UserFactory.create()

    const page = await visit(route('password_reset.create'))

    await page.getByLabel('Nomor Telepon').fill('081387882973')
    await page.getByRole('button', { name: 'Kirim Kode Atur Ulang' }).click()

    await page.assertPath('/forgot-password')
    await page.assertTextContains('body', 'Lupa Kata Sandi')
    await page.locator('[data-sonner-toast]').waitFor({ state: 'visible' })
    await page.assertTextContains(
      '[data-sonner-toast]',
      'Jika akun dengan nomor telepon tersebut ada, tautan atur ulang kata sandi telah dikirim melalui WhatsApp.'
    )
  })
})

test.group('Reset Password', (group) => {
  group.each.setup(() => testUtils.db().truncate())

  test('guest can visit reset password page with valid signed url', async ({ visit }) => {
    const user = await UserFactory.create()

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

    const page = await visit(resetUrl)

    await page.assertPath('/reset-password')
    await page.assertTextContains('body', 'Atur Ulang Kata Sandi')
  })

  test('guest cannot visit reset password page with invalid signed url', async ({
    visit,
    route,
  }) => {
    const user = await UserFactory.create()

    const page = await visit(
      route('password_reset.edit', { phone: user.phone, signature: 'invalidsignature' })
    )

    await page.assertPath('/reset-password')
    await page.assertTextContains('body', 'Tautan Tidak Valid')
  })

  test('user redirected to /order page when visiting reset password page while logged in', async ({
    visit,
    browserContext,
  }) => {
    const user = await UserFactory.create()

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

    await browserContext.loginAs(user)
    const page = await visit(resetUrl)

    await page.assertPath('/order')
    await page.assertTextContains('body', 'Buat Pesanan')
  })

  test('user can reset password with valid signed url and valid new password', async ({
    visit,
  }) => {
    const user = await UserFactory.create()

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

    const page = await visit(resetUrl)

    await page.getByLabel('Kata Sandi', { exact: true }).fill('password321')
    await page.getByLabel('Konfirmasi Kata Sandi', { exact: true }).fill('password321')
    await page.getByRole('button', { name: 'Atur Ulang Kata Sandi', exact: true }).click()

    await page.assertPath('/login')
    await page.assertTextContains('body', 'Masuk')
    await page.locator('[data-sonner-toast]').waitFor({ state: 'visible' })
    await page.assertTextContains(
      '[data-sonner-toast]',
      'Kata sandi berhasil diubah. Silakan masuk dengan kata sandi baru Anda.'
    )
  })
})
