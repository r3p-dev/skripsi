import { OrderFactory } from '#database/factories/order_factory'
import { UserFactory } from '#database/factories/user_factory'
import Transaction from '#models/transaction'
import { PaymentMethod, TransactionStatus } from '#enums/transaction_enum'
import { OrderStatus } from '#enums/order_status_enum'
import testUtils from '@adonisjs/core/services/test_utils'
import { test } from '@japa/runner'

test.group('Customer Payment', (group) => {
  group.each.setup(() => testUtils.db().truncate())

  test('starting a payment charges Midtrans and stores a pending QRIS transaction', async ({
    client,
    assert,
  }) => {
    const customer = await UserFactory.merge({ phone: '081211115001' }).create()
    const order = await OrderFactory.apply('waitingPayment').merge({ userId: customer.id }).create()

    const response = await client
      .post(`/orders/${order.orderNumber}/transactions`)
      .loginAs(customer)
      .withCsrfToken()

    response.assertRedirectsTo(`/orders/${order.orderNumber}/transactions/latest`)

    const transaction = await Transaction.query().where('orderId', order.id).firstOrFail()
    assert.equal(transaction.paymentMethod, PaymentMethod.QRIS)
    assert.equal(transaction.status, TransactionStatus.PENDING)
    assert.isNotNull(transaction.qrCode)
  }).timeout(30000)

  test('asking twice reuses the pending transaction instead of charging again', async ({
    client,
    assert,
  }) => {
    const customer = await UserFactory.merge({ phone: '081211115002' }).create()
    const order = await OrderFactory.apply('waitingPayment').merge({ userId: customer.id }).create()

    await client.post(`/orders/${order.orderNumber}/transactions`).loginAs(customer).withCsrfToken()

    await client.post(`/orders/${order.orderNumber}/transactions`).loginAs(customer).withCsrfToken()

    assert.lengthOf(await Transaction.query().where('orderId', order.id), 1)
  }).timeout(30000)

  test('an order that is not awaiting payment cannot be paid', async ({ client, assert }) => {
    const customer = await UserFactory.merge({ phone: '081211115003' }).create()
    const order = await OrderFactory.merge({ userId: customer.id }).create()

    const response = await client
      .post(`/orders/${order.orderNumber}/transactions`)
      .withInertia()
      .loginAs(customer)
      .header('referer', `/orders/${order.orderNumber}`)
      .withCsrfToken()

    response.assertInertiaPropsContains({
      errors: { status: 'Pesanan ini tidak memerlukan pembayaran saat ini.' },
    })

    assert.lengthOf(await Transaction.query().where('orderId', order.id), 0)
  })

  test('the payment page sends the customer back when no transaction exists yet', async ({
    client,
  }) => {
    const customer = await UserFactory.merge({ phone: '081211115004' }).create()
    const order = await OrderFactory.apply('waitingPayment').merge({ userId: customer.id }).create()

    const response = await client
      .get(`/orders/${order.orderNumber}/transactions/latest`)
      .withInertia()
      .loginAs(customer)

    response.assertRedirectsTo(`/orders/${order.orderNumber}`)
    response.assertInertiaPropsContains({
      flash: { error: 'Belum ada transaksi untuk pesanan ini.' },
    })
  })

  test('the payment page renders the QR code for the latest transaction', async ({
    client,
    assert,
  }) => {
    const customer = await UserFactory.merge({ phone: '081211115005' }).create()
    const order = await OrderFactory.apply('waitingPayment').merge({ userId: customer.id }).create()

    await Transaction.create({
      orderId: order.id,
      paymentMethod: PaymentMethod.QRIS,
      midtransOrderId: `${order.orderNumber}-1`,
      midtransTransactionId: 'trx-1',
      status: TransactionStatus.PENDING,
      qrCode: 'https://example.test/qr.png',
    })

    const response = await client
      .get(`/orders/${order.orderNumber}/transactions/latest`)
      .withInertia()
      .loginAs(customer)

    response.assertInertiaComponent('order/payment')
    assert.equal(response.inertiaProps.transaction.qrCode, 'https://example.test/qr.png')
    assert.equal(response.inertiaProps.backRoute, 'customer.order.show')
  })

  test('a walk-in order in cleaning is payable too', async ({ client, assert }) => {
    const customer = await UserFactory.merge({ phone: '081211115008' }).create()
    const order = await OrderFactory.apply('inCleaning').merge({ userId: customer.id }).create()

    const response = await client
      .post(`/orders/${order.orderNumber}/transactions`)
      .loginAs(customer)
      .withCsrfToken()

    response.assertRedirectsTo(`/orders/${order.orderNumber}/transactions/latest`)
    assert.lengthOf(await Transaction.query().where('orderId', order.id), 1)
  }).timeout(30000)

  test('an order with no total cannot be paid', async ({ client, assert }) => {
    const customer = await UserFactory.merge({ phone: '081211115009' }).create()
    const order = await OrderFactory.merge({
      userId: customer.id,
      status: OrderStatus.AWAITING_PAYMENT,
      totalPrice: null,
    }).create()

    const response = await client
      .post(`/orders/${order.orderNumber}/transactions`)
      .withInertia()
      .loginAs(customer)
      .header('referer', `/orders/${order.orderNumber}`)
      .withCsrfToken()

    response.assertInertiaPropsContains({
      errors: { status: 'Pesanan ini tidak memerlukan pembayaran saat ini.' },
    })

    assert.lengthOf(await Transaction.query().where('orderId', order.id), 0)
  })

  test('the payment page shows the most recent transaction', async ({ client, assert }) => {
    const customer = await UserFactory.merge({ phone: '081211115010' }).create()
    const order = await OrderFactory.apply('waitingPayment').merge({ userId: customer.id }).create()

    await Transaction.create({
      orderId: order.id,
      paymentMethod: PaymentMethod.QRIS,
      midtransOrderId: `${order.orderNumber}-old`,
      midtransTransactionId: 'trx-old',
      status: TransactionStatus.EXPIRED,
      qrCode: 'https://example.test/old.png',
    })

    const latest = await Transaction.create({
      orderId: order.id,
      paymentMethod: PaymentMethod.QRIS,
      midtransOrderId: `${order.orderNumber}-new`,
      midtransTransactionId: 'trx-new',
      status: TransactionStatus.PENDING,
      qrCode: 'https://example.test/new.png',
    })

    const response = await client
      .get(`/orders/${order.orderNumber}/transactions/latest`)
      .withInertia()
      .loginAs(customer)

    assert.equal(response.inertiaProps.transaction.id, latest.id)
    assert.equal(response.inertiaProps.transaction.qrCode, 'https://example.test/new.png')
  })

  test('an unknown order number is a 404, not a payment', async ({ client }) => {
    const customer = await UserFactory.merge({ phone: '081211115011' }).create()

    const response = await client
      .post('/orders/ORD000000-999/transactions')
      .loginAs(customer)
      .withCsrfToken()

    response.assertStatus(404)
  })

  test('a customer cannot start a payment for another customer order', async ({
    client,
    assert,
  }) => {
    const customer = await UserFactory.merge({ phone: '081211115006' }).create()
    const stranger = await UserFactory.merge({ phone: '081211115007' }).create()
    const order = await OrderFactory.apply('waitingPayment').merge({ userId: stranger.id }).create()

    const response = await client
      .post(`/orders/${order.orderNumber}/transactions`)
      .loginAs(customer)
      .withCsrfToken()

    response.assertStatus(404)
    assert.lengthOf(await Transaction.query().where('orderId', order.id), 0)
  })
})

test.group('Midtrans Charge Rate Limit', (group) => {
  group.each.setup(() => testUtils.db().truncate())

  /**
   * The cap sits around the charge itself, not the route, so reusing a pending
   * transaction must never consume the order's budget.
   */
  test('reusing a pending transaction does not count against the limit', async ({
    client,
    assert,
  }) => {
    const customer = await UserFactory.merge({ phone: '081211115020' }).create()
    const order = await OrderFactory.apply('waitingPayment').merge({ userId: customer.id }).create()

    for (let attempt = 0; attempt < 8; attempt++) {
      await client
        .post(`/orders/${order.orderNumber}/transactions`)
        .loginAs(customer)
        .withCsrfToken()
    }

    // One real charge, seven reuses — all of them successful.
    assert.lengthOf(await Transaction.query().where('orderId', order.id), 1)
  }).timeout(60000)

  test('repeated real charges for one order are eventually refused', async ({ client, assert }) => {
    const customer = await UserFactory.merge({ phone: '081211115021' }).create()
    const order = await OrderFactory.apply('waitingPayment').merge({ userId: customer.id }).create()

    /**
     * Expiring the pending transaction after each attempt forces the next
     * request past the reuse shortcut and into a genuine Midtrans charge.
     */
    let lastResponse
    for (let attempt = 0; attempt < 6; attempt++) {
      lastResponse = await client
        .post(`/orders/${order.orderNumber}/transactions`)
        .withInertia()
        .loginAs(customer)
        .header('referer', `/orders/${order.orderNumber}`)
        .withCsrfToken()

      await Transaction.query()
        .where('orderId', order.id)
        .update({ status: TransactionStatus.EXPIRED })
    }

    lastResponse!.assertInertiaPropsContains({
      errors: { status: 'Terlalu banyak percobaan pembayaran. Silakan coba lagi nanti.' },
    })

    // Five charges got through; the sixth was refused.
    assert.lengthOf(await Transaction.query().where('orderId', order.id), 5)
  }).timeout(120000)

  test('the limit is per order, not global', async ({ client, assert }) => {
    const customer = await UserFactory.merge({ phone: '081211115022' }).create()
    const first = await OrderFactory.apply('waitingPayment').merge({ userId: customer.id }).create()
    const second = await OrderFactory.apply('waitingPayment')
      .merge({ userId: customer.id })
      .create()

    for (let attempt = 0; attempt < 5; attempt++) {
      await client
        .post(`/orders/${first.orderNumber}/transactions`)
        .loginAs(customer)
        .withCsrfToken()
      await Transaction.query()
        .where('orderId', first.id)
        .update({ status: TransactionStatus.EXPIRED })
    }

    const response = await client
      .post(`/orders/${second.orderNumber}/transactions`)
      .loginAs(customer)
      .withCsrfToken()

    response.assertRedirectsTo(`/orders/${second.orderNumber}/transactions/latest`)
    assert.lengthOf(await Transaction.query().where('orderId', second.id), 1)
  }).timeout(120000)
})
