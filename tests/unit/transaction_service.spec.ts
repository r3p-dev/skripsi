import { test } from '@japa/runner'
import AddressService from '#services/address_service'
import Order from '#models/order'
import OrderService from '#services/order_service'
import Transaction from '#models/transaction'
import TransactionService from '#services/transaction_service'
import db from '@adonisjs/lucid/services/db'
import testUtils from '@adonisjs/core/services/test_utils'
import { OrderStatus } from '#enums/order_enum'
import { PaymentMethod, TransactionStatus } from '#enums/transaction_enum'
import { type MidtransNotification } from '#config/midtrans'
import { TransactionFactory } from '#database/factories/transaction_factory'
import { createCustomer, createOrder, validationMessages } from '#tests/utils/helpers'
import { midtransQrResponse, stubMidtransCharge } from '#tests/utils/fakes'
import { DateTime } from 'luxon'

const transactionService = new TransactionService(new OrderService(new AddressService()))

/**
 * The rate limiter keeps its own connection to the database, outside whatever
 * transaction a test is running in. Reaching for the same pooled client is
 * what lets a test read and rewrite its rows without the two deadlocking.
 */
const rateLimitClient = db.connection().getWriteClient()

function rateLimits() {
  return rateLimitClient.from('rate_limits')
}

async function createPayableOrder(totalPrice = '120000'): Promise<Order> {
  const customer = await createCustomer()

  return createOrder(customer, {
    attributes: { status: OrderStatus.AWAITING_PAYMENT, totalPrice },
  })
}

function notification(overrides: Partial<MidtransNotification> = {}): MidtransNotification {
  return {
    transaction_status: 'settlement',
    transaction_id: 'mt-1',
    order_id: 'ORDUJI-1',
    gross_amount: '120000.00',
    fraud_status: 'accept',
    payment_type: 'qris',
    ...overrides,
  } as MidtransNotification
}

test.group('TransactionService | starting a payment', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  test('a priced order gets a QRIS code to pay against', async ({ assert }) => {
    const restore = stubMidtransCharge(() => midtransQrResponse({ order_id: 'ORDUJI-99' }))
    const order = await createPayableOrder()

    try {
      const transaction = await transactionService.startPayment(order)

      assert.equal(transaction.orderId, order.id)
      assert.equal(transaction.status, TransactionStatus.PENDING)
      assert.equal(transaction.paymentMethod, PaymentMethod.QRIS)
      assert.equal(transaction.midtransOrderId, 'ORDUJI-99')
      assert.equal(transaction.midtransTransactionId, 'mt-test-1')
      assert.include(transaction.qrCode!, 'qr-code')
    } finally {
      restore()
    }
  })

  test('the amount charged is the total on the order', async ({ assert }) => {
    let charged: Record<string, unknown> | undefined

    const restore = stubMidtransCharge((parameter) => {
      charged = parameter.transaction_details as Record<string, unknown>

      return midtransQrResponse()
    })

    const order = await createPayableOrder('87500')

    try {
      await transactionService.startPayment(order)

      assert.equal(charged?.gross_amount, 87_500)
    } finally {
      restore()
    }
  })

  test('reloading the page reuses the code instead of buying a new one', async ({ assert }) => {
    let charges = 0

    const restore = stubMidtransCharge(() => {
      charges += 1

      return midtransQrResponse()
    })

    const order = await createPayableOrder()

    try {
      const first = await transactionService.startPayment(order)
      const second = await transactionService.startPayment(order)

      assert.equal(first.id, second.id)
      assert.equal(charges, 1)
    } finally {
      restore()
    }
  })

  test('a code that has gone stale is retired and replaced', async ({ assert }) => {
    const restore = stubMidtransCharge(() => midtransQrResponse())
    const order = await createPayableOrder()

    try {
      const first = await transactionService.startPayment(order)

      await db
        .from('transactions')
        .where('id', first.id)
        .update({ created_at: DateTime.now().minus({ hours: 1 }).toSQL() })

      const second = await transactionService.startPayment(order)

      assert.notEqual(second.id, first.id)
      assert.equal(second.status, TransactionStatus.PENDING)

      await first.refresh()
      assert.equal(first.status, TransactionStatus.EXPIRED)
    } finally {
      restore()
    }
  })

  test('each attempt is charged under its own Midtrans order id', async ({ assert }) => {
    const seen: string[] = []

    const restore = stubMidtransCharge((parameter) => {
      const details = parameter.transaction_details as { order_id: string }

      seen.push(details.order_id)

      return midtransQrResponse({ order_id: details.order_id })
    })

    const order = await createPayableOrder()

    try {
      const first = await transactionService.startPayment(order)

      await db
        .from('transactions')
        .where('id', first.id)
        .update({ created_at: DateTime.now().minus({ hours: 1 }).toSQL() })

      await transactionService.startPayment(order)

      assert.deepEqual(seen, [`${order.orderNumber}-1`, `${order.orderNumber}-2`])
    } finally {
      restore()
    }
  })

  test('an order that has not been priced yet cannot be paid', async ({ assert }) => {
    const customer = await createCustomer()
    const order = await createOrder(customer, {
      attributes: { status: OrderStatus.AWAITING_PAYMENT, totalPrice: null },
    })

    const [failure] = await validationMessages(() => transactionService.startPayment(order))

    assert.equal(failure.field, 'form')
    assert.match(failure.message, /belum ditentukan/i)
    assert.isEmpty(await Transaction.query().where('order_id', order.id))
  })

  test('an order at any other stage cannot be paid', async ({ assert }) => {
    const customer = await createCustomer()
    const order = await createOrder(customer, { attributes: { totalPrice: '120000' } })

    const [failure] = await validationMessages(() => transactionService.startPayment(order))

    assert.match(failure.message, /belum menunggu pembayaran/i)
    assert.isEmpty(await Transaction.query().where('order_id', order.id))
  })

  test('a payment gateway outage leaves nothing behind', async ({ assert }) => {
    const restore = stubMidtransCharge(() => {
      throw new Error('gateway down')
    })

    const order = await createPayableOrder()

    try {
      const [failure] = await validationMessages(() => transactionService.startPayment(order))

      assert.match(failure.message, /tidak tersedia/i)
      assert.isEmpty(await Transaction.query().where('order_id', order.id))
    } finally {
      restore()
    }
  })

  test('an outage on a retry keeps the code the customer already has', async ({ assert }) => {
    let restore = stubMidtransCharge(() => midtransQrResponse())
    const order = await createPayableOrder()
    const first = await transactionService.startPayment(order)

    restore()

    await db
      .from('transactions')
      .where('id', first.id)
      .update({ created_at: DateTime.now().minus({ hours: 1 }).toSQL() })

    restore = stubMidtransCharge(() => {
      throw new Error('gateway down')
    })

    try {
      await validationMessages(() => transactionService.startPayment(order))

      await first.refresh()
      assert.equal(first.status, TransactionStatus.PENDING)
    } finally {
      restore()
    }
  })
})

test.group('TransactionService | throttling the gateway', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())
  group.each.teardown(async () => {
    await rateLimits().delete()
  })

  /**
   * Makes the code the order is holding look old, so the next attempt has to
   * buy a new one from Midtrans instead of handing back the pending code.
   */
  async function ageTheCode(transaction: Transaction): Promise<void> {
    await db
      .from('transactions')
      .where('id', transaction.id)
      .update({ created_at: DateTime.now().minus({ hours: 1 }).toSQL() })
  }

  async function chargeRepeatedly(order: Order, times: number): Promise<void> {
    for (let attempt = 0; attempt < times; attempt++) {
      await ageTheCode(await transactionService.startPayment(order))
    }
  }

  /**
   * Fast-forwards past the block window rather than waiting fifteen real
   * minutes. The store keeps one row per key holding the moment it lapses, so
   * dating that row into the past is the window running out.
   */
  async function waitOutTheBlock(): Promise<void> {
    await rateLimits().update({ expire: Date.now() - 1000 })
  }

  test('an order cannot keep asking Midtrans for codes', async ({ assert }) => {
    let charges = 0

    const restore = stubMidtransCharge(() => {
      charges += 1

      return midtransQrResponse({ order_id: `ORDUJI-${charges}` })
    })

    const order = await createPayableOrder()

    try {
      await chargeRepeatedly(order, 5)

      const [failure] = await validationMessages(() => transactionService.startPayment(order))

      assert.equal(failure.field, 'form')
      assert.match(failure.message, /terlalu banyak/i)
      assert.equal(charges, 5, 'the blocked attempt never reached Midtrans')
    } finally {
      restore()
    }
  })

  test('the order can pay again once the block has passed', async ({ assert }) => {
    let charges = 0

    const restore = stubMidtransCharge(() => {
      charges += 1

      return midtransQrResponse({ order_id: `ORDUJI-${charges}` })
    })

    const order = await createPayableOrder()

    try {
      await chargeRepeatedly(order, 5)
      await validationMessages(() => transactionService.startPayment(order))

      await waitOutTheBlock()

      const transaction = await transactionService.startPayment(order)

      assert.equal(transaction.status, TransactionStatus.PENDING)
      assert.equal(charges, 6)
    } finally {
      restore()
    }
  })

  test('one order running out does not stop another from paying', async ({ assert }) => {
    let charges = 0

    const restore = stubMidtransCharge(() => {
      charges += 1

      return midtransQrResponse({ order_id: `ORDUJI-${charges}` })
    })

    const exhausted = await createPayableOrder()
    const other = await createPayableOrder()

    try {
      await chargeRepeatedly(exhausted, 5)
      await validationMessages(() => transactionService.startPayment(exhausted))

      const transaction = await transactionService.startPayment(other)

      assert.equal(transaction.orderId, other.id)
      assert.equal(transaction.status, TransactionStatus.PENDING)
    } finally {
      restore()
    }
  })
})

test.group('TransactionService | reading payments back', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  test('the pending payment wins over older closed ones', async ({ assert }) => {
    const order = await createPayableOrder()

    await TransactionFactory.merge({ orderId: order.id }).apply('expired').create()

    const pending = await TransactionFactory.merge({ orderId: order.id }).create()

    const latest = await transactionService.getLatestTransaction(order)

    assert.equal(latest?.id, pending.id)
  })

  test('with nothing pending, the most recent attempt is shown', async ({ assert }) => {
    const order = await createPayableOrder()

    await TransactionFactory.merge({ orderId: order.id }).apply('expired').create()

    const last = await TransactionFactory.merge({ orderId: order.id }).apply('failed').create()

    const latest = await transactionService.getLatestTransaction(order)

    assert.equal(latest?.id, last.id)
  })

  test('an order nobody has paid for has no payment', async ({ assert }) => {
    const order = await createPayableOrder()

    assert.isNull(await transactionService.getLatestTransaction(order))
  })
})

test.group('TransactionService | the Midtrans callback', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  async function pendingTransactionFor(order: Order): Promise<Transaction> {
    return TransactionFactory.merge({
      orderId: order.id,
      midtransOrderId: `${order.orderNumber}-1`,
    }).create()
  }

  test('a settled payment is recorded and the order moves to cleaning', async ({ assert }) => {
    const order = await createPayableOrder()
    const transaction = await pendingTransactionFor(order)

    await transactionService.handleNotification(
      notification({ order_id: transaction.midtransOrderId!, transaction_status: 'settlement' })
    )

    await transaction.refresh()
    assert.equal(transaction.status, TransactionStatus.PAID)

    const stored = await Order.findOrFail(order.id)
    assert.equal(stored.status, OrderStatus.IN_CLEANING)
  })

  test('a captured payment counts the same as a settled one', async ({ assert }) => {
    const order = await createPayableOrder()
    const transaction = await pendingTransactionFor(order)

    await transactionService.handleNotification(
      notification({ order_id: transaction.midtransOrderId!, transaction_status: 'capture' })
    )

    await transaction.refresh()
    assert.equal(transaction.status, TransactionStatus.PAID)
  })

  test('a capture held for fraud review is not money yet', async ({ assert }) => {
    const order = await createPayableOrder()
    const transaction = await pendingTransactionFor(order)

    await transactionService.handleNotification(
      notification({
        order_id: transaction.midtransOrderId!,
        transaction_status: 'capture',
        fraud_status: 'challenge',
      })
    )

    await transaction.refresh()
    assert.equal(transaction.status, TransactionStatus.PENDING)

    const stored = await Order.findOrFail(order.id)
    assert.equal(stored.status, OrderStatus.AWAITING_PAYMENT)
  })

  test('an expired code is marked expired and the order stays put', async ({ assert }) => {
    const order = await createPayableOrder()
    const transaction = await pendingTransactionFor(order)

    await transactionService.handleNotification(
      notification({ order_id: transaction.midtransOrderId!, transaction_status: 'expire' })
    )

    await transaction.refresh()
    assert.equal(transaction.status, TransactionStatus.EXPIRED)

    const stored = await Order.findOrFail(order.id)
    assert.equal(stored.status, OrderStatus.AWAITING_PAYMENT)
  })

  test('a cancelled payment is marked cancelled', async ({ assert }) => {
    const order = await createPayableOrder()
    const transaction = await pendingTransactionFor(order)

    await transactionService.handleNotification(
      notification({ order_id: transaction.midtransOrderId!, transaction_status: 'cancel' })
    )

    await transaction.refresh()
    assert.equal(transaction.status, TransactionStatus.CANCELLED)
  })

  test('an outcome we do not recognise is treated as a failure', async ({ assert }) => {
    const order = await createPayableOrder()
    const transaction = await pendingTransactionFor(order)

    await transactionService.handleNotification(
      notification({ order_id: transaction.midtransOrderId!, transaction_status: 'kabur' })
    )

    await transaction.refresh()
    assert.equal(transaction.status, TransactionStatus.FAILED)
  })

  test('the same notification arriving twice changes nothing', async ({ assert }) => {
    const order = await createPayableOrder()
    const transaction = await pendingTransactionFor(order)

    const payload = notification({
      order_id: transaction.midtransOrderId!,
      transaction_status: 'settlement',
    })

    await transactionService.handleNotification(payload)
    await transactionService.handleNotification(payload)

    await transaction.refresh()
    assert.equal(transaction.status, TransactionStatus.PAID)

    const stored = await Order.findOrFail(order.id)
    assert.equal(stored.status, OrderStatus.IN_CLEANING)
  })

  test('a late expiry never undoes money already received', async ({ assert }) => {
    const order = await createPayableOrder()
    const transaction = await pendingTransactionFor(order)

    await transactionService.handleNotification(
      notification({ order_id: transaction.midtransOrderId!, transaction_status: 'settlement' })
    )
    await transactionService.handleNotification(
      notification({ order_id: transaction.midtransOrderId!, transaction_status: 'expire' })
    )

    await transaction.refresh()
    assert.equal(transaction.status, TransactionStatus.PAID)
  })

  test('a notification for a payment we never made is ignored', async ({ assert }) => {
    await transactionService.handleNotification(notification({ order_id: 'TIDAK-ADA-1' }))

    assert.isEmpty(await Transaction.query().where('midtrans_order_id', 'TIDAK-ADA-1'))
  })

  test('paying an order that already moved on does not force it backwards', async ({ assert }) => {
    const customer = await createCustomer()
    const order = await createOrder(customer, {
      attributes: { status: OrderStatus.IN_CLEANING, totalPrice: '120000' },
    })
    const transaction = await TransactionFactory.merge({
      orderId: order.id,
      midtransOrderId: `${order.orderNumber}-1`,
    }).create()

    await transactionService.handleNotification(
      notification({ order_id: transaction.midtransOrderId!, transaction_status: 'settlement' })
    )

    await transaction.refresh()
    assert.equal(transaction.status, TransactionStatus.PAID)

    const stored = await Order.findOrFail(order.id)
    assert.equal(stored.status, OrderStatus.IN_CLEANING)
  })
})
