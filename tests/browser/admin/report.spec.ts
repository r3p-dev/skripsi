import { OrderFactory } from '#database/factories/order_factory'
import { UserFactory } from '#database/factories/user_factory'
import { ItemType, ServiceCategory, ServiceType } from '#enums/service_enum'
import { OrderStatus } from '#enums/order_status_enum'
import { PaymentMethod, TransactionStatus } from '#enums/transaction_enum'
import Item from '#models/item'
import Order from '#models/order'
import OrderItem from '#models/order_item'
import Service from '#models/service'
import Transaction from '#models/transaction'
import { formatRupiah } from '#utils/currency'
import testUtils from '@adonisjs/core/services/test_utils'
import { test } from '@japa/runner'
import { DateTime } from 'luxon'

function payFor(order: Order, paymentMethod: PaymentMethod = PaymentMethod.CASH) {
  return Transaction.create({
    orderId: order.id,
    paymentMethod,
    midtransOrderId: null,
    midtransTransactionId: null,
    status: TransactionStatus.PAID,
    qrCode: null,
  })
}

test.group('Admin Report Page', (group) => {
  group.each.setup(() => testUtils.db().truncate())

  test('the report totals the revenue and breaks it down', async ({
    visit,
    route,
    browserContext,
  }) => {
    const admin = await UserFactory.apply('admin').merge({ phone: '081394000001' }).create()

    const cash = await OrderFactory.merge({
      status: OrderStatus.COMPLETED,
      totalPrice: 30000,
    }).create()
    await payFor(cash, PaymentMethod.CASH)

    const qris = await OrderFactory.merge({
      status: OrderStatus.COMPLETED,
      totalPrice: 70000,
    }).create()
    await payFor(qris, PaymentMethod.QRIS)

    await browserContext.loginAs(admin)
    const page = await visit(route('admin.report.index'))

    await page.assertTextContains('body', 'Laporan Pendapatan')
    await page.assertTextContains('body', formatRupiah(100000))
    // The average of two paid orders, which only appears if the totals ran.
    await page.assertTextContains('body', formatRupiah(50000))

    // The breakdown tables, checked by their rows rather than by their
    // headings, which are uppercased in CSS.
    await page.assertTextContains('body', 'Tunai')
    await page.assertTextContains('body', 'QRIS')
    await page.assertTextContains('body', 'Online')
    await page.assertTextContains('body', 'Offline')
  })

  test('the most-requested services are ranked by what they earned', async ({
    visit,
    route,
    browserContext,
  }) => {
    const admin = await UserFactory.apply('admin').merge({ phone: '081394001001' }).create()

    const service = await Service.create({
      name: 'Deep Clean Premium',
      description: 'Perawatan khusus',
      category: ServiceCategory.SHOE_WASH,
      type: ServiceType.REGULAR,
      price: 75000,
    })

    const order = await OrderFactory.merge({
      status: OrderStatus.COMPLETED,
      totalPrice: 75000,
    }).create()
    await payFor(order)

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
      price: 75000,
      subtotal: 75000,
    })

    await browserContext.loginAs(admin)
    const page = await visit(route('admin.report.index'))

    await page.assertTextContains('body', 'Deep Clean Premium')
    await page.assertTextContains('body', formatRupiah(75000))
  })

  /**
   * A report has to be a link — an admin bookmarks a month or pastes it into
   * a message and expects the same numbers back.
   */
  test('picking a range puts it in the URL', async ({ visit, route, browserContext }) => {
    const admin = await UserFactory.apply('admin').merge({ phone: '081394002001' }).create()

    await browserContext.loginAs(admin)
    const page = await visit(route('admin.report.index'))

    await page.getByLabel('Dari').fill('2026-07-01')
    await page.getByLabel('Sampai').fill('2026-07-10')
    await page.getByRole('button', { name: 'Tampilkan' }).click()

    await page.assertUrlContains('from=2026-07-01')
    await page.assertUrlContains('to=2026-07-10')
    await page.assertTextContains('body', '1 Juli 2026')
    await page.assertTextContains('body', '10 Juli 2026')
  })

  test('a range with nothing in it reports zero rather than breaking', async ({
    visit,
    route,
    browserContext,
  }) => {
    const admin = await UserFactory.apply('admin').merge({ phone: '081394003001' }).create()

    const order = await OrderFactory.merge({
      status: OrderStatus.COMPLETED,
      totalPrice: 80000,
    }).create()
    await payFor(order)

    const lastYear = DateTime.now().minus({ years: 1 })

    await browserContext.loginAs(admin)
    const page = await visit(route('admin.report.index'))

    await page.getByLabel('Dari').fill(lastYear.toISODate()!)
    await page.getByLabel('Sampai').fill(lastYear.plus({ days: 5 }).toISODate()!)
    await page.getByRole('button', { name: 'Tampilkan' }).click()

    await page.assertTextContains('body', formatRupiah(0))
    await page.assertTextContains('body', 'Belum ada layanan terjual pada rentang ini')
  })
})
