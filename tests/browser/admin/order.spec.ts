import { OrderFactory } from '#database/factories/order_factory'
import { UserFactory } from '#database/factories/user_factory'
import { ActionName } from '#enums/order_action_enum'
import { ItemType, ServiceCategory, ServiceType } from '#enums/service_enum'
import Item from '#models/item'
import Order from '#models/order'
import OrderAction from '#models/order_action'
import OrderItem from '#models/order_item'
import Service from '#models/service'
import testUtils from '@adonisjs/core/services/test_utils'
import { test } from '@japa/runner'

async function priceOrder(order: Order, service: Service) {
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

test.group('Admin Order Monitor Page', (group) => {
  group.each.setup(() => testUtils.db().truncate())

  test('the monitor lists orders from every customer', async ({ visit, route, browserContext }) => {
    const admin = await UserFactory.apply('admin').merge({ phone: '081392000001' }).create()
    const online = await OrderFactory.merge({ customerName: 'Siti Rahayu' }).create()
    const walkIn = await OrderFactory.apply('offline')
      .merge({ customerName: 'Budi Santoso' })
      .create()

    await browserContext.loginAs(admin)
    const page = await visit(route('admin.order.index'))

    await page.assertTextContains('body', 'Pemantauan Pesanan')
    await page.assertTextContains('body', online.orderNumber)
    await page.assertTextContains('body', walkIn.orderNumber)
    await page.assertTextContains('body', 'Siti Rahayu')
    await page.assertTextContains('body', 'Budi Santoso')
  })

  test('the filters narrow the list by status and type', async ({
    visit,
    route,
    browserContext,
  }) => {
    const admin = await UserFactory.apply('admin').merge({ phone: '081392001001' }).create()
    const cleaning = await OrderFactory.apply('inCleaning').create()
    const scheduled = await OrderFactory.create()

    await browserContext.loginAs(admin)
    const page = await visit(route('admin.order.index'))

    await page.getByLabel('Status').selectOption('in_cleaning')
    await page.getByRole('button', { name: 'Terapkan' }).click()

    await page.assertTextContains('body', cleaning.orderNumber)
    await page.assertNotExists(page.getByRole('link', { name: scheduled.orderNumber }))
  })

  test('the search finds an order by its number', async ({ visit, route, browserContext }) => {
    const admin = await UserFactory.apply('admin').merge({ phone: '081392002001' }).create()
    const wanted = await OrderFactory.create()
    const other = await OrderFactory.create()

    await browserContext.loginAs(admin)
    const page = await visit(route('admin.order.index'))

    await page.getByLabel('Cari pesanan').fill(wanted.orderNumber)
    await page.getByRole('button', { name: 'Terapkan' }).click()

    await page.assertTextContains('body', wanted.orderNumber)
    await page.assertNotExists(page.getByRole('link', { name: other.orderNumber }))
  })

  test('the detail page shows the priced lines and who did what', async ({
    visit,
    route,
    browserContext,
  }) => {
    const admin = await UserFactory.apply('admin').merge({ phone: '081392003001' }).create()
    const staff = await UserFactory.apply('staff')
      .merge({ name: 'Petugas Lapangan', phone: '081392003002' })
      .create()

    const service = await Service.create({
      name: 'Deep Clean Sepatu',
      description: 'Cuci menyeluruh',
      category: ServiceCategory.SHOE_WASH,
      type: ServiceType.REGULAR,
      price: 35000,
    })

    const order = await OrderFactory.apply('waitingPayment').create()
    await priceOrder(order, service)
    await OrderAction.create({
      orderId: order.id,
      staffId: staff.id,
      name: ActionName.INSPECTION,
      photoPath: null,
      note: null,
    })

    await browserContext.loginAs(admin)
    const page = await visit(route('admin.order.show', { number: order.orderNumber }))

    await page.assertTextContains('body', order.orderNumber)
    await page.assertTextContains('body', 'Deep Clean Sepatu')
    await page.assertTextContains('body', 'Nike Air Max')
    await page.assertTextContains('body', 'Inspeksi Selesai')
    await page.assertTextContains('body', 'Petugas Lapangan')
  })

  /**
   * A walk-in has no account and no address, and the page has to say that
   * rather than render two empty panels.
   */
  test('a walk-in order explains why it has no address', async ({
    visit,
    route,
    browserContext,
  }) => {
    const admin = await UserFactory.apply('admin').merge({ phone: '081392004001' }).create()
    const order = await OrderFactory.apply('offline').create()

    await browserContext.loginAs(admin)
    const page = await visit(route('admin.order.show', { number: order.orderNumber }))

    await page.assertTextContains('body', 'Tanpa akun (offline)')
    await page.assertTextContains('body', 'diambil di konter')
  })

  test('an order that has not been inspected has no price breakdown yet', async ({
    visit,
    route,
    browserContext,
  }) => {
    const admin = await UserFactory.apply('admin').merge({ phone: '081392005001' }).create()
    const order = await OrderFactory.create()

    await browserContext.loginAs(admin)
    const page = await visit(route('admin.order.show', { number: order.orderNumber }))

    await page.assertTextContains('body', 'Barang belum diinspeksi')
    await page.assertTextContains('body', 'Belum ada transaksi')
  })

  test('the second page of the list is reachable', async ({ visit, route, browserContext }) => {
    const admin = await UserFactory.apply('admin').merge({ phone: '081392006001' }).create()
    await OrderFactory.createMany(12)

    await browserContext.loginAs(admin)
    const page = await visit(route('admin.order.index'))

    await page.assertTextContains('body', '1 / 2')
    await page.getByRole('link', { name: 'Halaman selanjutnya' }).click()

    await page.assertTextContains('body', '2 / 2')
  })
})
