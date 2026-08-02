import { OrderFactory } from '#database/factories/order_factory'
import { UserFactory } from '#database/factories/user_factory'
import { ActionName } from '#enums/order_action_enum'
import { OrderStatus } from '#enums/order_status_enum'
import { PaymentMethod, TransactionStatus } from '#enums/transaction_enum'
import type Order from '#models/order'
import OrderAction from '#models/order_action'
import Transaction from '#models/transaction'
import testUtils from '@adonisjs/core/services/test_utils'
import { test } from '@japa/runner'

function chargeFor(order: Order) {
  return Transaction.create({
    orderId: order.id,
    paymentMethod: PaymentMethod.QRIS,
    midtransOrderId: `${order.orderNumber}-1`,
    midtransTransactionId: 'trx-1',
    status: TransactionStatus.PENDING,
    qrCode: 'https://example.test/qr.png',
  })
}

test.group('Admin Reconciliation Page', (group) => {
  group.each.setup(() => testUtils.db().truncate())

  test('the page warns what a manual confirmation actually does', async ({
    visit,
    route,
    browserContext,
  }) => {
    const admin = await UserFactory.apply('admin').merge({ phone: '081391000001' }).create()
    const order = await OrderFactory.apply('waitingPayment').create()
    await chargeFor(order)

    await browserContext.loginAs(admin)
    const page = await visit(route('admin.reconciliation.index'))

    await page.assertTextContains('body', 'Rekonsiliasi Pembayaran')
    await page.assertTextContains('body', 'setiap konfirmasi dicatat atas nama Anda')
    await page.assertTextContains('body', order.orderNumber)
    await page.assertTextContains('body', 'Tertunda')
  })

  test('an admin can confirm a stuck payment by hand', async ({
    visit,
    route,
    browserContext,
    assert,
  }) => {
    const admin = await UserFactory.apply('admin').merge({ phone: '081391001001' }).create()
    const order = await OrderFactory.apply('waitingPayment').create()
    const charge = await chargeFor(order)

    await browserContext.loginAs(admin)
    const page = await visit(route('admin.reconciliation.index'))

    await page.getByRole('button', { name: `Konfirmasi pembayaran ${order.orderNumber}` }).click()
    await page.assertTextContains('body', 'Konfirmasi pembayaran manual?')

    await page.getByLabel('Metode Pembayaran').selectOption(PaymentMethod.CASH)
    await page.getByLabel('Alasan').fill('Bukti transfer diterima, callback Midtrans tidak masuk')
    await page.getByRole('button', { name: 'Tandai Lunas' }).click()

    await page.locator('[data-sonner-toast]').waitFor({ state: 'visible' })
    await page.assertTextContains('[data-sonner-toast]', 'dikonfirmasi manual')

    await order.refresh()
    assert.equal(order.status, OrderStatus.IN_CLEANING)

    await charge.refresh()
    assert.equal(charge.status, TransactionStatus.PAID)

    const action = await OrderAction.query()
      .where('orderId', order.id)
      .where('name', ActionName.PAYMENT_OVERRIDE)
      .firstOrFail()
    assert.equal(action.staffId, admin.id)
  })

  test('a confirmation without a reason is refused', async ({
    visit,
    route,
    browserContext,
    assert,
  }) => {
    const admin = await UserFactory.apply('admin').merge({ phone: '081391002001' }).create()
    const order = await OrderFactory.apply('waitingPayment').create()

    await browserContext.loginAs(admin)
    const page = await visit(route('admin.reconciliation.index'))

    await page.getByRole('button', { name: `Konfirmasi pembayaran ${order.orderNumber}` }).click()
    await page.getByLabel('Metode Pembayaran').selectOption(PaymentMethod.CASH)
    await page.getByLabel('Alasan').fill('oke')
    await page.getByRole('button', { name: 'Tandai Lunas' }).click()

    await page.assertTextContains('body', 'Catatan minimal 5 karakter')

    await order.refresh()
    assert.equal(order.status, OrderStatus.AWAITING_PAYMENT)
  })

  test('an empty queue says so rather than showing a blank table', async ({
    visit,
    route,
    browserContext,
  }) => {
    const admin = await UserFactory.apply('admin').merge({ phone: '081391003001' }).create()
    await OrderFactory.apply('inCleaning').create()

    await browserContext.loginAs(admin)
    const page = await visit(route('admin.reconciliation.index'))

    await page.assertTextContains('body', 'Tidak ada pesanan yang menunggu pelunasan')
  })

  /**
   * The confirmed order carries its own audit line, which is what makes the
   * override attributable after the fact.
   */
  test('the override shows up on the order audit trail', async ({
    visit,
    route,
    browserContext,
  }) => {
    const admin = await UserFactory.apply('admin').merge({ phone: '081391004001' }).create()
    const order = await OrderFactory.apply('waitingPayment').create()

    await browserContext.loginAs(admin)
    const page = await visit(route('admin.reconciliation.index'))

    await page.getByRole('button', { name: `Konfirmasi pembayaran ${order.orderNumber}` }).click()
    await page.getByLabel('Metode Pembayaran').selectOption(PaymentMethod.DEBIT)
    await page.getByLabel('Alasan').fill('Dibayar langsung di toko')
    await page.getByRole('button', { name: 'Tandai Lunas' }).click()

    await page.locator('[data-sonner-toast]').waitFor({ state: 'visible' })

    const detail = await visit(route('admin.order.show', { number: order.orderNumber }))
    await detail.assertTextContains('body', 'Pembayaran Dikonfirmasi Manual')
    await detail.assertTextContains('body', 'Dibayar langsung di toko')
    await detail.assertTextContains('body', admin.name)
  })
})
