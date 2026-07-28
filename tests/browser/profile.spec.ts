import { test } from '@japa/runner'
import testUtils from '@adonisjs/core/services/test_utils'
import { UserFactory } from '#database/factories/user_factory'
import { AddressFactory } from '#database/factories/address_factory'

test.group('Address', (group) => {
  group.each.setup(() => testUtils.db().truncate())

  test('user can view address', async ({ visit, route, browserContext }) => {
    const user = await UserFactory.create()
    const address = await AddressFactory.merge({
      userId: user.id,
    }).create()

    await browserContext.loginAs(user)
    const page = await visit(route('customer.address.show'))

    await page.assertPath('/address')

    await page.assertTextContains('body', address.name)
    await page.assertTextContains('body', address.phone)
    await page.assertTextContains('body', address.street)
  })

  test('user can visit address create page', async ({ visit, route, browserContext }) => {
    const user = await UserFactory.create()

    await browserContext.loginAs(user)
    const page = await visit(route('customer.address.create'))

    await page.assertPath('/address/create')
    await page.assertTextContains('body', 'Alamat')
  })

  test('pinpoint map fills latitude and longitude from browser geolocation', async ({
    visit,
    route,
    browserContext,
    assert,
  }) => {
    const user = await UserFactory.create()

    await browserContext.grantPermissions(['geolocation'])
    await browserContext.setGeolocation({
      latitude: -6.9555305,
      longitude: 107.6540353,
    })

    await browserContext.loginAs(user)
    const page = await visit(route('customer.address.create'))

    const latitude = page.locator('input[type="hidden"][name="latitude"]')
    const longitude = page.locator('input[type="hidden"][name="longitude"]')
    await latitude.waitFor({ state: 'attached' })
    await longitude.waitFor({ state: 'attached' })

    assert.equal(await latitude.inputValue(), '-6.9555305')
    assert.equal(await longitude.inputValue(), '107.6540353')
  })

  test('user can create address', async ({ visit, route, browserContext, assert }) => {
    const user = await UserFactory.create()

    await browserContext.grantPermissions(['geolocation'])
    await browserContext.setGeolocation({ latitude: -6.9555305, longitude: 107.6540353 })

    await browserContext.loginAs(user)
    const page = await visit(route('customer.address.create'))

    await page.getByLabel('Nama Lengkap').fill('John Doe')
    await page.getByLabel('Nomor Telepon').fill('081387882973')
    await page.getByLabel('Alamat').fill('Jl. Contoh Alamat No. 123')
    await page.getByLabel('Catatan Tambahan').fill('Catatan tambahan untuk alamat ini')
    const latitude = page.locator('input[type="hidden"][name="latitude"]')
    const longitude = page.locator('input[type="hidden"][name="longitude"]')
    await latitude.waitFor({ state: 'attached' })
    await longitude.waitFor({ state: 'attached' })

    assert.equal(await latitude.inputValue(), '-6.9555305')
    assert.equal(await longitude.inputValue(), '107.6540353')

    await page.getByRole('button', { name: 'Simpan' }).click()

    await page.assertPath('/address')
    await page.assertTextContains('body', 'Alamat')
    await page.locator('[data-sonner-toast]').waitFor({ state: 'visible' })
    await page.assertTextContains('[data-sonner-toast]', 'Berhasil menambahkan alamat.')

    await page.assertTextContains('body', 'John Doe')
    await page.assertTextContains('body', '081387882973')
    await page.assertTextContains('body', 'Jl. Contoh Alamat No. 123')
  })
})

test.group('Profile', (group) => {
  group.each.setup(() => testUtils.db().truncate())

  test('user can view profile', async ({ visit, route, browserContext }) => {
    const user = await UserFactory.create()

    await browserContext.loginAs(user)
    const page = await visit(route('customer.profile.show'))

    await page.assertPath('/profile')
    await page.assertTextContains('body', user.name)
    await page.assertTextContains('body', user.phone)
  })
})
