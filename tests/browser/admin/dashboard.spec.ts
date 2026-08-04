import { OrderFactory } from '#database/factories/order_factory'
import { UserFactory } from '#database/factories/user_factory'
import { OrderStatus } from '#enums/order_status_enum'
import { PaymentMethod, TransactionStatus } from '#enums/transaction_enum'
import type Order from '#models/order'
import Transaction from '#models/transaction'
import { formatRupiah } from '#utils/currency'
import testUtils from '@adonisjs/core/services/test_utils'
import { test } from '@japa/runner'

function payFor(order: Order) {
  return Transaction.create({
    orderId: order.id,
    paymentMethod: PaymentMethod.CASH,
    midtransOrderId: null,
    midtransTransactionId: null,
    status: TransactionStatus.PAID,
    qrCode: null,
  })
}

test.group('Admin Dashboard Page', (group) => {
  group.each.setup(() => testUtils.db().truncate())

  test('the dashboard shows the headline figures and the latest orders', async ({
    visit,
    route,
    browserContext,
  }) => {
    const admin = await UserFactory.apply('admin').merge({ phone: '081370000001' }).create()

    const order = await OrderFactory.merge({
      status: OrderStatus.COMPLETED,
      customerName: 'Siti Rahayu',
      totalPrice: 80000,
    }).create()
    await payFor(order)

    await browserContext.loginAs(admin)
    const page = await visit(route('admin.dashboard.index'))

    await page.assertTextContains('body', 'Dasbor')
    /*
      The card labels are uppercased in CSS, which `innerText` reflects, so the
      figures themselves are what this checks: one order, and its revenue.
    */
    await page.assertTextContains('body', formatRupiah(80000))
    await page.assertTextContains('body', '1 pesanan selesai')
    await page.assertTextContains('body', order.orderNumber)
    await page.assertTextContains('body', 'Siti Rahayu')
    await page.assertTextContains('body', 'Selesai')
  })

  test('an empty shop says so instead of rendering a blank table', async ({
    visit,
    route,
    browserContext,
  }) => {
    const admin = await UserFactory.apply('admin').merge({ phone: '081370001001' }).create()

    await browserContext.loginAs(admin)
    const page = await visit(route('admin.dashboard.index'))

    await page.assertTextContains('body', 'Belum ada pesanan')
  })

  /**
   * The stub dashboard had no layout at all, which left an admin on a page
   * with no way to reach anything else.
   */
  test('every admin section is reachable from the sidebar', async ({
    visit,
    route,
    browserContext,
  }) => {
    const admin = await UserFactory.apply('admin').merge({ phone: '081370002001' }).create()

    await browserContext.loginAs(admin)
    const page = await visit(route('admin.dashboard.index'))

    for (const [label, path, heading] of [
      ['Pesanan', '/admin/orders', 'Pemantauan Pesanan'],
      ['Rekonsiliasi', '/admin/reconciliations', 'Rekonsiliasi Pembayaran'],
      ['Layanan', '/admin/services', 'Katalog Layanan'],
      ['Pengguna', '/admin/users', 'Manajemen Pengguna'],
      ['Laporan', '/admin/reports', 'Laporan Pendapatan'],
      ['Profil', '/admin/profile', 'Profil Saya'],
    ]) {
      await page.getByRole('link', { name: label, exact: true }).click()

      await page.assertPath(path)
      await page.assertTextContains('body', heading)
    }
  })

  test('the recent order list links through to the order', async ({
    visit,
    route,
    browserContext,
  }) => {
    const admin = await UserFactory.apply('admin').merge({ phone: '081370003001' }).create()
    const order = await OrderFactory.create()

    await browserContext.loginAs(admin)
    const page = await visit(route('admin.dashboard.index'))

    await page.getByRole('link', { name: order.orderNumber }).first().click()

    await page.assertPath(`/admin/orders/${order.orderNumber}`)
    await page.assertTextContains('body', order.customerName)
  })
})
