import { OrderFactory } from '#database/factories/order_factory'
import { UserFactory } from '#database/factories/user_factory'
import { PaymentMethod, TransactionStatus } from '#enums/transaction_enum'
import Transaction from '#models/transaction'
import hash from '@adonisjs/core/services/hash'
import testUtils from '@adonisjs/core/services/test_utils'
import { test } from '@japa/runner'

test.group('Admin Profile Page', (group) => {
  group.each.setup(() => testUtils.db().truncate())

  test('the profile shows the account and what it is responsible for', async ({
    visit,
    route,
    browserContext,
  }) => {
    const admin = await UserFactory.apply('admin').merge({ phone: '081393000001' }).create()
    await UserFactory.apply('staff').merge({ phone: '081393000002' }).create()

    const order = await OrderFactory.apply('completed').create()
    await Transaction.create({
      orderId: order.id,
      paymentMethod: PaymentMethod.CASH,
      midtransOrderId: null,
      midtransTransactionId: null,
      status: TransactionStatus.PAID,
      qrCode: null,
    })

    await browserContext.loginAs(admin)
    const page = await visit(route('admin.profile.show'))

    await page.assertTextContains('body', 'Profil Saya')
    await page.assertTextContains('body', admin.name)
    await page.assertTextContains('body', admin.phone)
    await page.assertTextContains('body', 'Jumlah Petugas')
    await page.assertTextContains('body', 'Transaksi Terbayar')
  })

  test('an admin can change their password inline', async ({
    visit,
    route,
    browserContext,
    assert,
  }) => {
    const admin = await UserFactory.apply('admin').merge({ phone: '081393001001' }).create()

    await browserContext.loginAs(admin)
    const page = await visit(route('admin.profile.show'))

    await page.getByRole('button', { name: 'Ubah kata sandi' }).click()
    await page.getByLabel('Kata Sandi Saat Ini').fill('password123')
    await page.getByLabel('Kata Sandi Baru').fill('newpassword1')
    await page.getByLabel('Konfirmasi Kata Sandi').fill('newpassword1')
    await page.getByRole('button', { name: 'Simpan' }).click()

    await page.locator('[data-sonner-toast]').waitFor({ state: 'visible' })
    await page.assertTextContains('[data-sonner-toast]', 'Kata sandi berhasil diperbarui')

    await admin.refresh()
    assert.isTrue(await hash.verify(admin.password, 'newpassword1'))
  })

  test('a wrong current password is reported on the form', async ({
    visit,
    route,
    browserContext,
    assert,
  }) => {
    const admin = await UserFactory.apply('admin').merge({ phone: '081393002001' }).create()

    await browserContext.loginAs(admin)
    const page = await visit(route('admin.profile.show'))

    await page.getByRole('button', { name: 'Ubah kata sandi' }).click()
    await page.getByLabel('Kata Sandi Saat Ini').fill('wrongpassword1')
    await page.getByLabel('Kata Sandi Baru').fill('newpassword1')
    await page.getByLabel('Konfirmasi Kata Sandi').fill('newpassword1')
    await page.getByRole('button', { name: 'Simpan' }).click()

    await page.assertTextContains('body', 'Kata sandi saat ini salah')

    await admin.refresh()
    assert.isTrue(await hash.verify(admin.password, 'password123'))
  })

  test('requesting a phone change explains the WhatsApp step', async ({
    visit,
    route,
    browserContext,
  }) => {
    const admin = await UserFactory.apply('admin').merge({ phone: '081393003001' }).create()

    await browserContext.loginAs(admin)
    const page = await visit(route('admin.profile.show'))

    await page.getByRole('button', { name: 'Ubah nomor telepon' }).click()

    await page.assertTextContains(
      'body',
      'Tautan verifikasi akan dikirim melalui WhatsApp ke nomor baru.'
    )
  })

  test('reusing the current number is rejected inline', async ({
    visit,
    route,
    browserContext,
  }) => {
    const admin = await UserFactory.apply('admin').merge({ phone: '081393004001' }).create()

    await browserContext.loginAs(admin)
    const page = await visit(route('admin.profile.show'))

    await page.getByRole('button', { name: 'Ubah nomor telepon' }).click()

    // PhoneInput keeps name="phone" on a hidden input, so target the visible id.
    await page.locator('input#phone').fill(admin.phone)
    await page.getByRole('button', { name: 'Kirim' }).click()

    await page.assertTextContains('body', 'Nomor telepon baru tidak boleh sama dengan yang lama')
  })

  /**
   * An admin's name is attributed on every payment override they record, so
   * it is fixed here the same way a staff member's is.
   */
  test('an admin cannot rename themselves from their own profile', async ({
    visit,
    route,
    browserContext,
    assert,
  }) => {
    const admin = await UserFactory.apply('admin').merge({ phone: '081393005001' }).create()

    await browserContext.loginAs(admin)
    const page = await visit(route('admin.profile.show'))

    assert.equal(await page.getByRole('button', { name: 'Ubah nama' }).count(), 0)
  })

  test('logging out returns the admin to the public home page', async ({
    visit,
    route,
    browserContext,
  }) => {
    const admin = await UserFactory.apply('admin').merge({ phone: '081393006001' }).create()

    await browserContext.loginAs(admin)
    const page = await visit(route('admin.profile.show'))

    await page.getByRole('button', { name: 'Keluar' }).click()

    await page.assertPath('/')
    await page.locator('[data-sonner-toast]').waitFor({ state: 'visible' })
    await page.assertTextContains('[data-sonner-toast]', 'Berhasil keluar.')
  })
})
