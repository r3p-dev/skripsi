import { test } from '@japa/runner'
import Order from '#models/order'
import Transaction from '#models/transaction'
import testUtils from '@adonisjs/core/services/test_utils'
import { OrderStatus } from '#enums/order_enum'
import { TransactionStatus } from '#enums/transaction_enum'
import { TransactionFactory } from '#database/factories/transaction_factory'
import { createCustomer, createOrder, inputErrors } from '#tests/utils/helpers'
import { midtransQrResponse, stubMidtransCharge } from '#tests/utils/fakes'

async function payableOrder(totalPrice = '120000') {
  const customer = await createCustomer()
  const order = await createOrder(customer, {
    attributes: { status: OrderStatus.AWAITING_PAYMENT, totalPrice },
  })

  return { customer, order }
}

test.group('Customer payment | starting one', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  test('a priced order can be paid and lands on the QRIS page', async ({ client, assert }) => {
    const restore = stubMidtransCharge(() => midtransQrResponse())
    const { customer, order } = await payableOrder()

    try {
      const response = await client
        .post(`/orders/${order.orderNumber}/payment`)
        .loginAs(customer.user)
        .withCsrfToken()
        .redirects(0)

      response.assertStatus(302)
      response.assertHeader('location', `/orders/${order.orderNumber}/payment`)

      const transaction = await Transaction.query().where('order_id', order.id).firstOrFail()

      assert.equal(transaction.status, TransactionStatus.PENDING)
      assert.isNotNull(transaction.qrCode)
    } finally {
      restore()
    }
  })

  test('an order that is not awaiting payment is refused', async ({ client, assert }) => {
    const customer = await createCustomer()
    const order = await createOrder(customer, { attributes: { totalPrice: '120000' } })

    const response = await client
      .post(`/orders/${order.orderNumber}/payment`)
      .loginAs(customer.user)
      .withCsrfToken()
      .redirects(0)

    response.assertStatus(302)
    assert.property(inputErrors(response), 'form')
    assert.isEmpty(await Transaction.query().where('order_id', order.id))
  })

  test('an order with no bill yet is refused', async ({ client, assert }) => {
    const customer = await createCustomer()
    const order = await createOrder(customer, {
      attributes: { status: OrderStatus.AWAITING_PAYMENT, totalPrice: null },
    })

    const response = await client
      .post(`/orders/${order.orderNumber}/payment`)
      .loginAs(customer.user)
      .withCsrfToken()
      .redirects(0)

    response.assertStatus(302)
    assert.property(inputErrors(response), 'form')
    assert.isEmpty(await Transaction.query().where('order_id', order.id))
  })

  test("a customer cannot pay someone else's order", async ({ client, assert }) => {
    const { order } = await payableOrder()
    const intruder = await createCustomer()

    const response = await client
      .post(`/orders/${order.orderNumber}/payment`)
      .loginAs(intruder.user)
      .withCsrfToken()
      .redirects(0)

    response.assertStatus(404)
    assert.isEmpty(await Transaction.query().where('order_id', order.id))
  })

  test('a guest is sent to sign in', async ({ client }) => {
    const { order } = await payableOrder()

    const response = await client
      .post(`/orders/${order.orderNumber}/payment`)
      .withCsrfToken()
      .redirects(0)

    response.assertStatus(302)
    response.assertHeader('location', '/login')
  })
})

test.group('Customer payment | the payment page', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  test('shows the QRIS code and what is owed', async ({ client }) => {
    const { customer, order } = await payableOrder()
    const transaction = await TransactionFactory.merge({ orderId: order.id }).create()

    const response = await client
      .get(`/orders/${order.orderNumber}/payment`)
      .loginAs(customer.user)
      .withInertia()

    response.assertStatus(200)
    response.assertInertiaComponent('order/payment')
    response.assertInertiaPropsContains({
      order: { orderNumber: order.orderNumber, totalPrice: 120000 },
      transaction: { qrCode: transaction.qrCode, status: TransactionStatus.PENDING },
    })
  })

  test('shows a settled payment as paid', async ({ client }) => {
    const { customer, order } = await payableOrder()

    await TransactionFactory.merge({ orderId: order.id }).apply('paid').create()

    const response = await client
      .get(`/orders/${order.orderNumber}/payment`)
      .loginAs(customer.user)
      .withInertia()

    response.assertInertiaPropsContains({ transaction: { status: TransactionStatus.PAID } })
  })

  test('sends the customer back when there is nothing to pay against', async ({ client }) => {
    const { customer, order } = await payableOrder()

    const response = await client
      .get(`/orders/${order.orderNumber}/payment`)
      .loginAs(customer.user)
      .redirects(0)

    response.assertStatus(302)
    response.assertHeader('location', `/orders/${order.orderNumber}`)
    response.assertFlashMessage('error', 'Belum ada pembayaran untuk pesanan ini.')
  })

  test("never opens another customer's payment", async ({ client }) => {
    const { order } = await payableOrder()
    const intruder = await createCustomer()

    await TransactionFactory.merge({ orderId: order.id }).create()

    const response = await client
      .get(`/orders/${order.orderNumber}/payment`)
      .loginAs(intruder.user)
      .withInertia()

    response.assertStatus(404)
  })
})

test.group('Customer payment | the order detail offers it', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  test('a priced order offers to be paid', async ({ client }) => {
    const { customer, order } = await payableOrder()

    const response = await client
      .get(`/orders/${order.orderNumber}`)
      .loginAs(customer.user)
      .withInertia()

    response.assertInertiaPropsContains({ canPay: true })
  })

  test('an order still being collected does not', async ({ client }) => {
    const customer = await createCustomer()
    const order = await createOrder(customer, { states: ['collected'] })

    const response = await client
      .get(`/orders/${order.orderNumber}`)
      .loginAs(customer.user)
      .withInertia()

    response.assertInertiaPropsContains({ canPay: false })
  })

  test('an order awaiting payment with no bill does not', async ({ client }) => {
    const customer = await createCustomer()
    const order = await createOrder(customer, {
      attributes: { status: OrderStatus.AWAITING_PAYMENT, totalPrice: null },
    })

    const response = await client
      .get(`/orders/${order.orderNumber}`)
      .loginAs(customer.user)
      .withInertia()

    response.assertInertiaPropsContains({ canPay: false })
  })
})

test.group('Customer payment | retrying', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  test('an expired code can be replaced with a fresh one', async ({ client, assert }) => {
    const restore = stubMidtransCharge(() => midtransQrResponse())
    const { customer, order } = await payableOrder()

    await TransactionFactory.merge({ orderId: order.id }).apply('expired').create()

    try {
      const response = await client
        .post(`/orders/${order.orderNumber}/payment`)
        .loginAs(customer.user)
        .withCsrfToken()
        .redirects(0)

      response.assertStatus(302)

      const pending = await Transaction.query()
        .where('order_id', order.id)
        .andWhere('status', TransactionStatus.PENDING)

      assert.lengthOf(pending, 1)
    } finally {
      restore()
    }
  })

  test('a paid order is never charged a second time', async ({ client, assert }) => {
    const { customer, order } = await payableOrder()

    await TransactionFactory.merge({ orderId: order.id }).apply('paid').create()
    await order.merge({ status: OrderStatus.IN_CLEANING }).save()

    const response = await client
      .post(`/orders/${order.orderNumber}/payment`)
      .loginAs(customer.user)
      .withCsrfToken()
      .redirects(0)

    response.assertStatus(302)
    assert.property(inputErrors(response), 'form')
    assert.lengthOf(await Transaction.query().where('order_id', order.id), 1)

    const stored = await Order.findOrFail(order.id)

    assert.equal(stored.status, OrderStatus.IN_CLEANING)
  })
})
