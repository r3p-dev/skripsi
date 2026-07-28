import { OrderFactory } from '#database/factories/order_factory'
import { UserFactory } from '#database/factories/user_factory'
import OrderAction from '#models/order_action'
import { ActionName } from '#enums/order_action_enum'
import hash from '@adonisjs/core/services/hash'
import testUtils from '@adonisjs/core/services/test_utils'
import { test } from '@japa/runner'

test.group('Staff Profile Page', (group) => {
  group.each.setup(() => testUtils.db().truncate())

  test('the profile shows the account, task count and join date', async ({
    visit,
    route,
    browserContext,
  }) => {
    const staff = await UserFactory.apply('staff').merge({ phone: '081255550001' }).create()
    const order = await OrderFactory.create()

    await OrderAction.create({
      orderId: order.id,
      staffId: staff.id,
      name: ActionName.PICKUP,
      photoPath: null,
      note: null,
    })

    await browserContext.loginAs(staff)
    const page = await visit(route('staff.profile.show'))

    await page.assertTextContains('body', 'Profil Saya')
    await page.assertTextContains('body', staff.name)
    await page.assertTextContains('body', staff.phone)
    await page.assertTextContains('body', 'Tugas Selesai')
    await page.assertTextContains('body', '1')
  })

  test('the profile keeps the staff bottom navigation', async ({
    visit,
    route,
    browserContext,
  }) => {
    const staff = await UserFactory.apply('staff').merge({ phone: '081255550002' }).create()

    await browserContext.loginAs(staff)
    const page = await visit(route('staff.profile.show'))

    // The stub page had no layout, which stranded staff with no way back.
    await page.getByRole('link', { name: 'Tugas', exact: true }).click()

    await page.assertPath('/staff/trips')
    await page.assertTextContains('body', 'Antrean Tugas')
  })

  test('staff cannot rename themselves', async ({ visit, route, browserContext, assert }) => {
    const staff = await UserFactory.apply('staff').merge({ phone: '081255550003' }).create()

    await browserContext.loginAs(staff)
    const page = await visit(route('staff.profile.show'))

    assert.equal(await page.getByRole('button', { name: 'Ubah nama' }).count(), 0)
  })
})

test.group('Staff Profile Editing', (group) => {
  group.each.setup(() => testUtils.db().truncate())

  test('a staff member can change their password inline', async ({
    visit,
    route,
    browserContext,
    assert,
  }) => {
    const staff = await UserFactory.apply('staff').merge({ phone: '081255551001' }).create()

    await browserContext.loginAs(staff)
    const page = await visit(route('staff.profile.show'))

    await page.getByRole('button', { name: 'Ubah kata sandi' }).click()
    await page.getByLabel('Kata Sandi Saat Ini').fill('password123')
    await page.getByLabel('Kata Sandi Baru').fill('newpassword1')
    await page.getByLabel('Konfirmasi Kata Sandi').fill('newpassword1')
    await page.getByRole('button', { name: 'Simpan' }).click()

    await page.locator('[data-sonner-toast]').waitFor({ state: 'visible' })
    await page.assertTextContains('[data-sonner-toast]', 'Kata sandi berhasil diperbarui')

    await staff.refresh()
    assert.isTrue(await hash.verify(staff.password, 'newpassword1'))
  })

  test('a wrong current password is reported on the form', async ({
    visit,
    route,
    browserContext,
    assert,
  }) => {
    const staff = await UserFactory.apply('staff').merge({ phone: '081255551002' }).create()

    await browserContext.loginAs(staff)
    const page = await visit(route('staff.profile.show'))

    await page.getByRole('button', { name: 'Ubah kata sandi' }).click()
    await page.getByLabel('Kata Sandi Saat Ini').fill('wrongpassword1')
    await page.getByLabel('Kata Sandi Baru').fill('newpassword1')
    await page.getByLabel('Konfirmasi Kata Sandi').fill('newpassword1')
    await page.getByRole('button', { name: 'Simpan' }).click()

    await page.assertTextContains('body', 'Kata sandi saat ini salah')

    await staff.refresh()
    assert.isTrue(await hash.verify(staff.password, 'password123'))
  })

  test('cancelling the password form closes it', async ({ visit, route, browserContext }) => {
    const staff = await UserFactory.apply('staff').merge({ phone: '081255551003' }).create()

    await browserContext.loginAs(staff)
    const page = await visit(route('staff.profile.show'))

    await page.getByRole('button', { name: 'Ubah kata sandi' }).click()
    await page.locator('input[name="currentPassword"]').waitFor({ state: 'visible' })

    await page.getByRole('button', { name: 'Batal' }).click()

    await page.locator('input[name="currentPassword"]').waitFor({ state: 'detached' })
    await page.assertTextContains('body', '••••••••••')
  })

  test('requesting a phone change explains the WhatsApp step', async ({
    visit,
    route,
    browserContext,
  }) => {
    const staff = await UserFactory.apply('staff').merge({ phone: '081255552001' }).create()

    await browserContext.loginAs(staff)
    const page = await visit(route('staff.profile.show'))

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
    const staff = await UserFactory.apply('staff').merge({ phone: '081255552002' }).create()

    await browserContext.loginAs(staff)
    const page = await visit(route('staff.profile.show'))

    await page.getByRole('button', { name: 'Ubah nomor telepon' }).click()

    // PhoneInput keeps name="phone" on a hidden input, so target the visible id.
    await page.locator('input#phone').fill(staff.phone)
    await page.getByRole('button', { name: 'Kirim' }).click()

    await page.assertTextContains('body', 'Nomor telepon baru tidak boleh sama dengan yang lama')
  })

  test('logging out returns the staff member to the public home page', async ({
    visit,
    route,
    browserContext,
  }) => {
    const staff = await UserFactory.apply('staff').merge({ phone: '081255553001' }).create()

    await browserContext.loginAs(staff)
    const page = await visit(route('staff.profile.show'))

    await page.getByRole('button', { name: 'Keluar' }).click()

    await page.assertPath('/')
    await page.locator('[data-sonner-toast]').waitFor({ state: 'visible' })
    await page.assertTextContains('[data-sonner-toast]', 'Berhasil keluar.')
  })
})
