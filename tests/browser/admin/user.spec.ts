import { OrderFactory } from '#database/factories/order_factory'
import { UserFactory } from '#database/factories/user_factory'
import { Role } from '#enums/role_enum'
import User from '#models/user'
import hash from '@adonisjs/core/services/hash'
import testUtils from '@adonisjs/core/services/test_utils'
import { test } from '@japa/runner'

test.group('Admin User Management Page', (group) => {
  group.each.setup(() => testUtils.db().truncate())

  /**
   * The public signup form always creates a customer, so this screen is the
   * only way a staff account comes into existence.
   */
  test('an admin can create a staff account', async ({ visit, route, browserContext, assert }) => {
    const admin = await UserFactory.apply('admin').merge({ phone: '081390000001' }).create()

    await browserContext.loginAs(admin)
    const page = await visit(route('admin.user.index'))

    await page.getByRole('link', { name: 'Akun Baru' }).click()
    await page.assertPath('/admin/users/create')

    await page.getByLabel('Nama Lengkap').fill('Petugas Baru')
    await page.locator('input#phone').fill('081390000002')
    await page.getByLabel('Peran').selectOption(Role.STAFF)
    await page.getByLabel('Kata Sandi', { exact: true }).fill('password123')
    await page.getByLabel('Konfirmasi Kata Sandi').fill('password123')
    await page.getByRole('button', { name: 'Buat Akun' }).click()

    await page.assertPath('/admin/users')
    await page.locator('[data-sonner-toast]').waitFor({ state: 'visible' })
    await page.assertTextContains('[data-sonner-toast]', 'Petugas Baru berhasil dibuat')

    const created = await User.findByOrFail('phone', '081390000002')
    assert.equal(created.role, Role.STAFF)
    assert.isTrue(await hash.verify(created.password, 'password123'))
  })

  test('a duplicate phone number is reported on the form', async ({
    visit,
    route,
    browserContext,
  }) => {
    const admin = await UserFactory.apply('admin').merge({ phone: '081390001001' }).create()
    await UserFactory.merge({ phone: '081390001002' }).create()

    await browserContext.loginAs(admin)
    const page = await visit(route('admin.user.create'))

    await page.getByLabel('Nama Lengkap').fill('Nama Kembar')
    await page.locator('input#phone').fill('081390001002')
    await page.getByLabel('Peran').selectOption(Role.STAFF)
    await page.getByLabel('Kata Sandi', { exact: true }).fill('password123')
    await page.getByLabel('Konfirmasi Kata Sandi').fill('password123')
    await page.getByRole('button', { name: 'Buat Akun' }).click()

    await page.assertTextContains('body', 'Nomor telepon sudah digunakan')
  })

  test('an admin can rename an account without setting a new password', async ({
    visit,
    route,
    browserContext,
    assert,
  }) => {
    const admin = await UserFactory.apply('admin').merge({ phone: '081390002001' }).create()
    const staff = await UserFactory.apply('staff').merge({ phone: '081390002002' }).create()

    await browserContext.loginAs(admin)
    const page = await visit(route('admin.user.index'))

    await page.getByRole('link', { name: `Ubah ${staff.name}` }).click()
    await page.assertPath(`/admin/users/${staff.id}/edit`)
    await page.assertTextContains('body', 'Kosongkan jika kata sandi tidak perlu diubah.')

    await page.getByLabel('Nama Lengkap').fill('Nama Diperbaiki')
    await page.getByRole('button', { name: 'Simpan Perubahan' }).click()

    await page.assertPath('/admin/users')

    await staff.refresh()
    assert.equal(staff.name, 'Nama Diperbaiki')
    assert.isTrue(await hash.verify(staff.password, 'password123'))
  })

  /**
   * Demoting yourself is a one-way door — role middleware would lock you out
   * of the admin area the moment it saved.
   */
  test('an admin cannot change their own role from the form', async ({
    visit,
    route,
    browserContext,
  }) => {
    const admin = await UserFactory.apply('admin').merge({ phone: '081390003001' }).create()

    await browserContext.loginAs(admin)
    const page = await visit(route('admin.user.edit', { id: admin.id }))

    await page.assertDisabled(page.getByLabel('Peran'))
    await page.assertTextContains('body', 'Anda tidak dapat mengubah peran akun Anda sendiri.')
  })

  test('an admin can delete an account with no history', async ({
    visit,
    route,
    browserContext,
    assert,
  }) => {
    const admin = await UserFactory.apply('admin').merge({ phone: '081390004001' }).create()
    const customer = await UserFactory.merge({ phone: '081390004002' }).create()

    await browserContext.loginAs(admin)
    const page = await visit(route('admin.user.index'))

    await page.getByRole('button', { name: `Hapus ${customer.name}` }).click()
    await page.assertTextContains('body', 'Hapus akun?')
    await page.getByRole('button', { name: 'Hapus', exact: true }).click()

    await page.locator('[data-sonner-toast]').waitFor({ state: 'visible' })
    assert.isNull(await User.find(customer.id))
  })

  test('an account that appears in the order record cannot be deleted', async ({
    visit,
    route,
    browserContext,
  }) => {
    const admin = await UserFactory.apply('admin').merge({ phone: '081390005001' }).create()
    const customer = await UserFactory.merge({ phone: '081390005002' }).create()
    await OrderFactory.merge({ userId: customer.id }).create()

    await browserContext.loginAs(admin)
    const page = await visit(route('admin.user.index'))

    await page.assertDisabled(page.getByRole('button', { name: `Hapus ${customer.name}` }))
  })

  test('the role tabs narrow the list', async ({ visit, route, browserContext }) => {
    const admin = await UserFactory.apply('admin').merge({ phone: '081390006001' }).create()
    const staff = await UserFactory.apply('staff')
      .merge({ name: 'Petugas Lapangan', phone: '081390006002' })
      .create()
    await UserFactory.merge({ name: 'Pelanggan Setia', phone: '081390006003' }).create()

    await browserContext.loginAs(admin)
    const page = await visit(route('admin.user.index'))

    await page.getByRole('link', { name: 'Petugas 1' }).click()

    await page.assertTextContains('body', staff.name)
    await page.assertNotExists(page.getByRole('link', { name: 'Ubah Pelanggan Setia' }))
  })
})
