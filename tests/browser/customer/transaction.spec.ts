import { test } from '@japa/runner'
import Transaction from '#models/transaction'
import testUtils from '@adonisjs/core/services/test_utils'
import { OrderStatus } from '#enums/order_enum'
import { TransactionStatus } from '#enums/transaction_enum'
import { TransactionFactory } from '#database/factories/transaction_factory'
import { createCustomer, createOrder } from '#tests/utils/helpers'
import { midtransQrResponse, stubMidtransCharge } from '#tests/utils/fakes'

async function payableOrder(totalPrice = '120000') {
  const customer = await createCustomer()
  const order = await createOrder(customer, {
    attributes: { status: OrderStatus.AWAITING_PAYMENT, totalPrice },
  })

  return { customer, order }
}

test.group('Customer payment in the browser', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  test('a customer pays a priced order from the order detail', async ({
    visit,
    browserContext,
    assert,
  }) => {
    const restore = stubMidtransCharge(() => midtransQrResponse())
    const { customer, order } = await payableOrder()

    await browserContext.loginAs(customer.user)

    try {
      const page = await visit(`/orders/${order.orderNumber}`)

      await page.getByRole('button', { name: 'Bayar Sekarang' }).click()
      await page.waitForURL(`**/orders/${order.orderNumber}/payment`)

      await page.getByAltText('Kode QRIS').waitFor()
      await page.assertExists(page.getByText('Menunggu pembayaran'))

      const transaction = await Transaction.query().where('order_id', order.id).firstOrFail()

      assert.equal(transaction.status, TransactionStatus.PENDING)
    } finally {
      restore()
    }
  })

  test('an order that cannot be paid offers no button', async ({
    visit,
    browserContext,
    assert,
  }) => {
    const customer = await createCustomer()
    const order = await createOrder(customer)

    await browserContext.loginAs(customer.user)

    const page = await visit(`/orders/${order.orderNumber}`)

    await page.getByText(order.orderNumber).first().waitFor()

    assert.equal(await page.getByRole('button', { name: 'Bayar Sekarang' }).count(), 0)
  })

  test('a settled payment shows as done', async ({ visit, browserContext }) => {
    const { customer, order } = await payableOrder()

    await TransactionFactory.merge({ orderId: order.id }).apply('paid').create()
    await browserContext.loginAs(customer.user)

    const page = await visit(`/orders/${order.orderNumber}/payment`)

    await page.getByText('Pembayaran Berhasil').waitFor()
  })

  test('an expired code offers a fresh one', async ({ visit, browserContext }) => {
    const { customer, order } = await payableOrder()

    await TransactionFactory.merge({ orderId: order.id }).apply('expired').create()
    await browserContext.loginAs(customer.user)

    const page = await visit(`/orders/${order.orderNumber}/payment`)

    await page.getByRole('button', { name: 'Buat Pembayaran Baru' }).waitFor()
  })
})
