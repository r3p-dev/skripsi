import { AddressFactory } from '#database/factories/address_factory'
import { OrderFactory } from '#database/factories/order_factory'
import { UserFactory } from '#database/factories/user_factory'
import hash from '@adonisjs/core/services/hash'
import testUtils from '@adonisjs/core/services/test_utils'
import { test } from '@japa/runner'

test.group('Customer Profile Page', (group) => {
  group.each.setup(() => testUtils.db().truncate())

  test('the profile shows account details, stats and address', async ({
    visit,
    route,
    browserContext,
  }) => {
    const customer = await UserFactory.create()
    const address = await AddressFactory.merge({ userId: customer.id, isActive: true }).create()
    await OrderFactory.apply('completed').merge({ userId: customer.id }).createMany(3)

    await browserContext.loginAs(customer)
    const page = await visit(route('customer.profile.show'))

    await page.assertTextContains('body', customer.name)
    await page.assertTextContains('body', customer.phone)
    await page.assertTextContains('body', address.street)
    await page.assertTextContains('body', '3')
  })

  test('the profile prompts for an address when there is none', async ({
    visit,
    route,
    browserContext,
  }) => {
    const customer = await UserFactory.create()

    await browserContext.loginAs(customer)
    const page = await visit(route('customer.profile.show'))

    await page.assertTextContains('body', 'Belum ada alamat')
  })
})

test.group('Customer Inline Editing', (group) => {
  group.each.setup(() => testUtils.db().truncate())

  /**
   * The name field is located by its input name rather than its label: the
   * pencil button's aria-label is "Ubah nama", which getByLabel('Nama') also
   * matches, so the two would be indistinguishable once the form closes again.
   */
  test('the name form only appears once the pencil is clicked', async ({
    visit,
    route,
    browserContext,
  }) => {
    const customer = await UserFactory.create()

    await browserContext.loginAs(customer)
    const page = await visit(route('customer.profile.show'))

    await page.getByRole('button', { name: 'Ubah nama' }).waitFor({ state: 'visible' })
    await page.locator('input[name="name"]').waitFor({ state: 'detached' })

    await page.getByRole('button', { name: 'Ubah nama' }).click()

    await page.locator('input[name="name"]').waitFor({ state: 'visible' })
  })

  test('a customer can rename themselves without leaving the page', async ({
    visit,
    route,
    browserContext,
    assert,
  }) => {
    const customer = await UserFactory.create()

    await browserContext.loginAs(customer)
    const page = await visit(route('customer.profile.show'))

    await page.getByRole('button', { name: 'Ubah nama' }).click()
    await page.locator('input[name="name"]').fill('Budi Santoso')
    await page.getByRole('button', { name: 'Simpan' }).click()

    await page.locator('[data-sonner-toast]').waitFor({ state: 'visible' })
    await page.assertTextContains('[data-sonner-toast]', 'Nama berhasil diperbarui')

    await page.assertPath('/profile')
    await page.assertTextContains('body', 'Budi Santoso')

    await customer.refresh()
    assert.equal(customer.name, 'Budi Santoso')
  })

  test('cancelling the name form leaves the name untouched', async ({
    visit,
    route,
    browserContext,
    assert,
  }) => {
    const customer = await UserFactory.create()

    await browserContext.loginAs(customer)
    const page = await visit(route('customer.profile.show'))

    await page.getByRole('button', { name: 'Ubah nama' }).click()
    await page.locator('input[name="name"]').fill('Nama Lain')
    await page.getByRole('button', { name: 'Batal' }).click()

    await page.locator('input[name="name"]').waitFor({ state: 'detached' })
    await page.assertTextContains('body', customer.name)

    await customer.refresh()
    assert.notEqual(customer.name, 'Nama Lain')
  })

  test('an invalid name is rejected inline', async ({ visit, route, browserContext }) => {
    const customer = await UserFactory.create()

    await browserContext.loginAs(customer)
    const page = await visit(route('customer.profile.show'))

    await page.getByRole('button', { name: 'Ubah nama' }).click()
    await page.locator('input[name="name"]').fill('Budi 123')
    await page.getByRole('button', { name: 'Simpan' }).click()

    await page.assertTextContains('body', 'Nama lengkap hanya boleh berisi huruf')
  })

  test('a customer can change their password', async ({ visit, route, browserContext, assert }) => {
    const customer = await UserFactory.create()

    await browserContext.loginAs(customer)
    const page = await visit(route('customer.profile.show'))

    await page.getByRole('button', { name: 'Ubah kata sandi' }).click()
    await page.getByLabel('Kata Sandi Saat Ini').fill('password123')
    await page.getByLabel('Kata Sandi Baru').fill('newpassword1')
    await page.getByLabel('Konfirmasi Kata Sandi').fill('newpassword1')
    await page.getByRole('button', { name: 'Simpan' }).click()

    await page.locator('[data-sonner-toast]').waitFor({ state: 'visible' })
    await page.assertTextContains('[data-sonner-toast]', 'Kata sandi berhasil diperbarui')

    await customer.refresh()
    assert.isTrue(await hash.verify(customer.password, 'newpassword1'))
  })

  test('a wrong current password is reported on the form', async ({
    visit,
    route,
    browserContext,
    assert,
  }) => {
    const customer = await UserFactory.create()

    await browserContext.loginAs(customer)
    const page = await visit(route('customer.profile.show'))

    await page.getByRole('button', { name: 'Ubah kata sandi' }).click()
    await page.getByLabel('Kata Sandi Saat Ini').fill('wrongpassword1')
    await page.getByLabel('Kata Sandi Baru').fill('newpassword1')
    await page.getByLabel('Konfirmasi Kata Sandi').fill('newpassword1')
    await page.getByRole('button', { name: 'Simpan' }).click()

    await page.assertTextContains('body', 'Kata sandi saat ini salah')

    await customer.refresh()
    assert.isTrue(await hash.verify(customer.password, 'password123'))
  })

  test('requesting a phone change asks for verification over WhatsApp', async ({
    visit,
    route,
    browserContext,
  }) => {
    const customer = await UserFactory.create()

    await browserContext.loginAs(customer)
    const page = await visit(route('customer.profile.show'))

    await page.getByRole('button', { name: 'Ubah nomor telepon' }).click()

    await page.assertTextContains(
      'body',
      'Tautan verifikasi akan dikirim melalui WhatsApp ke nomor baru.'
    )
  })

  test('reusing the current phone number is rejected inline', async ({
    visit,
    route,
    browserContext,
  }) => {
    const customer = await UserFactory.create()

    await browserContext.loginAs(customer)
    const page = await visit(route('customer.profile.show'))

    await page.getByRole('button', { name: 'Ubah nomor telepon' }).click()

    // PhoneInput keeps name="phone" on a hidden input and formats a visible
    // one, so the visible field has to be reached by its id.
    await page.locator('input#phone').fill(customer.phone)
    await page.getByRole('button', { name: 'Kirim' }).click()

    await page.assertTextContains('body', 'Nomor telepon baru tidak boleh sama dengan yang lama')
  })
})

test.group('Customer Navigation', (group) => {
  group.each.setup(() => testUtils.db().truncate())

  test('the bottom bar moves between the three customer tabs', async ({
    visit,
    route,
    browserContext,
  }) => {
    const customer = await UserFactory.create()

    await browserContext.loginAs(customer)
    const page = await visit(route('customer.order.create'))

    await page.getByRole('link', { name: 'Pesanan', exact: true }).click()
    await page.assertPath('/orders')
    await page.assertTextContains('body', 'Riwayat Pesanan')

    await page.getByRole('link', { name: 'Profil' }).click()
    await page.assertPath('/profile')
    await page.assertTextContains('body', 'Profil Saya')

    await page.getByRole('link', { name: 'Pesan', exact: true }).click()
    await page.assertPath('/order')
    await page.assertTextContains('body', 'Buat Pesanan')
  })

  test('the address page is reachable from the profile', async ({
    visit,
    route,
    browserContext,
  }) => {
    const customer = await UserFactory.create()
    const address = await AddressFactory.merge({ userId: customer.id, isActive: true }).create()

    await browserContext.loginAs(customer)
    const page = await visit(route('customer.profile.show'))

    await page.getByText(address.street).click()

    await page.assertPath('/address')
    await page.assertTextContains('body', address.name)
  })

  test('logging out returns the customer to the public home page', async ({
    visit,
    route,
    browserContext,
  }) => {
    const customer = await UserFactory.create()

    await browserContext.loginAs(customer)
    const page = await visit(route('customer.profile.show'))

    await page.getByRole('button', { name: 'Keluar' }).click()

    await page.assertPath('/')
    await page.locator('[data-sonner-toast]').waitFor({ state: 'visible' })
    await page.assertTextContains('[data-sonner-toast]', 'Berhasil keluar.')
  })
})
