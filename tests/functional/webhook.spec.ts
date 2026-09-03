import { test } from '@japa/runner'
import Order from '#models/order'
import env from '#start/env'
import testUtils from '@adonisjs/core/services/test_utils'
import { OrderStatus } from '#enums/order_enum'
import { TransactionStatus } from '#enums/transaction_enum'
import { TransactionFactory } from '#database/factories/transaction_factory'
import { createCustomer, createOrder } from '#tests/utils/helpers'
import { createHash } from 'node:crypto'

function signed(payload: Record<string, string>): Record<string, string> {
  const serverKey = env.get('MIDTRANS_SERVER_KEY').release()

  const signature = createHash('sha512')
    .update(`${payload.order_id}${payload.status_code}${payload.gross_amount}${serverKey}`)
    .digest('hex')

  return { ...payload, signature_key: signature }
}

function callbackPayload(overrides: Record<string, string> = {}): Record<string, string> {
  return {
    transaction_status: 'settlement',
    transaction_id: 'mt-callback-1',
    order_id: 'ORDUJI-1',
    status_code: '200',
    gross_amount: '120000.00',
    fraud_status: 'accept',
    payment_type: 'qris',
    ...overrides,
  }
}

async function pendingPayment() {
  const customer = await createCustomer()
  const order = await createOrder(customer, {
    attributes: { status: OrderStatus.AWAITING_PAYMENT, totalPrice: '120000' },
  })
  const transaction = await TransactionFactory.merge({
    orderId: order.id,
    midtransOrderId: `${order.orderNumber}-1`,
  }).create()

  return { order, transaction }
}

test.group('Midtrans callback', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  test('a signed settlement is recorded and moves the order on', async ({ client, assert }) => {
    const { order, transaction } = await pendingPayment()

    const response = await client
      .post('/transaction/callback')
      .json(signed(callbackPayload({ order_id: transaction.midtransOrderId! })))

    response.assertStatus(200)

    await transaction.refresh()
    assert.equal(transaction.status, TransactionStatus.PAID)

    const stored = await Order.findOrFail(order.id)

    assert.equal(stored.status, OrderStatus.IN_CLEANING)
  })

  test('an unsigned call is refused and changes nothing', async ({ client, assert }) => {
    const { order, transaction } = await pendingPayment()

    const response = await client
      .post('/transaction/callback')
      .json(callbackPayload({ order_id: transaction.midtransOrderId!, signature_key: 'palsu' }))

    response.assertStatus(403)

    await transaction.refresh()
    assert.equal(transaction.status, TransactionStatus.PENDING)

    const stored = await Order.findOrFail(order.id)

    assert.equal(stored.status, OrderStatus.AWAITING_PAYMENT)
  })

  test('a tampered amount invalidates the signature', async ({ client, assert }) => {
    const { transaction } = await pendingPayment()

    const payload = signed(callbackPayload({ order_id: transaction.midtransOrderId! }))

    const response = await client
      .post('/transaction/callback')
      .json({ ...payload, gross_amount: '1000.00' })

    response.assertStatus(403)

    await transaction.refresh()
    assert.equal(transaction.status, TransactionStatus.PENDING)
  })

  test('an expiry is recorded without touching the order', async ({ client, assert }) => {
    const { order, transaction } = await pendingPayment()

    const response = await client.post('/transaction/callback').json(
      signed(
        callbackPayload({
          order_id: transaction.midtransOrderId!,
          transaction_status: 'expire',
        })
      )
    )

    response.assertStatus(200)

    await transaction.refresh()
    assert.equal(transaction.status, TransactionStatus.EXPIRED)

    const stored = await Order.findOrFail(order.id)

    assert.equal(stored.status, OrderStatus.AWAITING_PAYMENT)
  })

  test('a callback for a payment we never made is accepted quietly', async ({ client }) => {
    const response = await client
      .post('/transaction/callback')
      .json(signed(callbackPayload({ order_id: 'TIDAK-ADA-1' })))

    response.assertStatus(200)
  })

  test('the same callback twice leaves one paid transaction', async ({ client, assert }) => {
    const { order, transaction } = await pendingPayment()

    const payload = signed(callbackPayload({ order_id: transaction.midtransOrderId! }))

    await client.post('/transaction/callback').json(payload)
    await client.post('/transaction/callback').json(payload)

    await transaction.refresh()
    assert.equal(transaction.status, TransactionStatus.PAID)

    const stored = await Order.findOrFail(order.id)

    assert.equal(stored.status, OrderStatus.IN_CLEANING)
  })
})
