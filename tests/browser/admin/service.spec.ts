import { OrderFactory } from '#database/factories/order_factory'
import { UserFactory } from '#database/factories/user_factory'
import { ItemType, ServiceCategory, ServiceType } from '#enums/service_enum'
import Item from '#models/item'
import OrderItem from '#models/order_item'
import Service from '#models/service'
import testUtils from '@adonisjs/core/services/test_utils'
import { test } from '@japa/runner'

function createService(name = 'Cuci Sepatu Reguler', price = 30000) {
  return Service.create({
    name,
    description: 'Cuci sepatu standar',
    category: ServiceCategory.SHOE_WASH,
    type: ServiceType.REGULAR,
    price,
  })
}

async function useServiceOnAnOrder(service: Service) {
  const order = await OrderFactory.apply('waitingPayment').create()

  const item = await Item.create({
    type: ItemType.SHOE,
    brand: 'Nike',
    model: 'Air Max',
    material: 'Kanvas',
    size: '42',
    condition: 'Kotor ringan',
    note: null,
  })

  await OrderItem.create({
    orderId: order.id,
    itemId: item.id,
    serviceId: service.id,
    name: `${service.name} - Nike Air Max`,
    price: Number(service.price),
    subtotal: Number(service.price),
  })
}

test.group('Admin Service Catalogue Page', (group) => {
  group.each.setup(() => testUtils.db().truncate())

  test('an admin can add a service to the catalogue', async ({
    visit,
    route,
    browserContext,
    assert,
  }) => {
    const admin = await UserFactory.apply('admin').merge({ phone: '081380000001' }).create()

    await browserContext.loginAs(admin)
    const page = await visit(route('admin.service.index'))

    await page.getByRole('link', { name: 'Layanan Baru' }).click()
    await page.assertPath('/admin/services/create')

    await page.getByLabel('Nama Layanan').fill('Deep Clean Sepatu')
    await page.getByLabel('Deskripsi').fill('Pembersihan menyeluruh luar dan dalam')
    await page.getByLabel('Harga (Rp)').fill('35000')
    await page.getByLabel('Kategori').selectOption(ServiceCategory.SHOE_WASH)
    await page.getByLabel('Tipe Harga').selectOption(ServiceType.REGULAR)
    await page.getByRole('button', { name: 'Simpan Layanan' }).click()

    await page.assertPath('/admin/services')
    await page.locator('[data-sonner-toast]').waitFor({ state: 'visible' })
    await page.assertTextContains('[data-sonner-toast]', 'Deep Clean Sepatu berhasil ditambahkan')

    const service = await Service.findByOrFail('name', 'Deep Clean Sepatu')
    assert.equal(Number(service.price), 35000)
  })

  test('a rejected service reports the problem on the form', async ({
    visit,
    route,
    browserContext,
    assert,
  }) => {
    const admin = await UserFactory.apply('admin').merge({ phone: '081380001001' }).create()

    await browserContext.loginAs(admin)
    const page = await visit(route('admin.service.create'))

    await page.getByLabel('Nama Layanan').fill('ab')
    await page.getByLabel('Deskripsi').fill('Terlalu pendek namanya')
    await page.getByLabel('Harga (Rp)').fill('35000')
    await page.getByLabel('Kategori').selectOption(ServiceCategory.SHOE_WASH)
    await page.getByLabel('Tipe Harga').selectOption(ServiceType.REGULAR)
    await page.getByRole('button', { name: 'Simpan Layanan' }).click()

    await page.assertTextContains('body', 'Nama layanan minimal 3 karakter')
    assert.isNull(await Service.findBy('name', 'ab'))
  })

  test('an admin can reprice a service', async ({ visit, route, browserContext, assert }) => {
    const admin = await UserFactory.apply('admin').merge({ phone: '081380002001' }).create()
    const service = await createService()

    await browserContext.loginAs(admin)
    const page = await visit(route('admin.service.index'))

    await page.getByRole('link', { name: `Ubah ${service.name}` }).click()
    await page.assertPath(`/admin/services/${service.id}/edit`)

    await page.getByLabel('Harga (Rp)').fill('45000')
    await page.getByRole('button', { name: 'Simpan Perubahan' }).click()

    await page.assertPath('/admin/services')

    await service.refresh()
    assert.equal(Number(service.price), 45000)
  })

  /**
   * The first thing an admin worries about when changing a price is whether
   * it rewrites orders already quoted. It does not, and the page says so.
   */
  test('editing a service that is in use explains that old orders keep their price', async ({
    visit,
    route,
    browserContext,
  }) => {
    const admin = await UserFactory.apply('admin').merge({ phone: '081380003001' }).create()
    const service = await createService()
    await useServiceOnAnOrder(service)

    await browserContext.loginAs(admin)
    const page = await visit(route('admin.service.edit', { id: service.id }))

    await page.assertTextContains('body', 'Perubahan harga hanya berlaku untuk pesanan baru')
  })

  test('an admin can delete a service that has never priced an order', async ({
    visit,
    route,
    browserContext,
    assert,
  }) => {
    const admin = await UserFactory.apply('admin').merge({ phone: '081380004001' }).create()
    const service = await createService()

    await browserContext.loginAs(admin)
    const page = await visit(route('admin.service.index'))

    await page.getByRole('button', { name: `Hapus ${service.name}` }).click()
    await page.assertTextContains('body', 'Hapus layanan?')
    await page.getByRole('button', { name: 'Hapus', exact: true }).click()

    await page.locator('[data-sonner-toast]').waitFor({ state: 'visible' })
    assert.isNull(await Service.find(service.id))
  })

  test('a service that has priced an order cannot be deleted from the list', async ({
    visit,
    route,
    browserContext,
    assert,
  }) => {
    const admin = await UserFactory.apply('admin').merge({ phone: '081380005001' }).create()
    const service = await createService()
    await useServiceOnAnOrder(service)

    await browserContext.loginAs(admin)
    const page = await visit(route('admin.service.index'))

    await page.assertDisabled(page.getByRole('button', { name: `Hapus ${service.name}` }))

    assert.isNotNull(await Service.find(service.id))
  })

  test('the search narrows the catalogue', async ({ visit, route, browserContext }) => {
    const admin = await UserFactory.apply('admin').merge({ phone: '081380006001' }).create()
    await createService('Repaint Sepatu')
    await createService('Cuci Helm')

    await browserContext.loginAs(admin)
    const page = await visit(route('admin.service.index'))

    await page.getByLabel('Cari layanan').fill('Repaint')
    await page.getByLabel('Cari layanan').press('Enter')

    await page.assertTextContains('body', 'Repaint Sepatu')
    await page.assertNotExists(page.getByRole('link', { name: 'Ubah Cuci Helm' }))
  })
})
