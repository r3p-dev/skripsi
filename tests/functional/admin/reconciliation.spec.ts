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

const override = {
  paymentMethod: PaymentMethod.CASH,
  note: 'Bukti transfer diterima, callback Midtrans tidak masuk',
}

function chargeFor(order: Order, status: TransactionStatus = TransactionStatus.PENDING) {
  return Transaction.create({
    orderId: order.id,
    paymentMethod: PaymentMethod.QRIS,
    midtransOrderId: `${order.orderNumber}-1`,
    midtransTransactionId: 'trx-1',
    status,
    qrCode: 'https://example.test/qr.png',
  })
}

test.group('Admin Payment Reconciliation', (group) => {
  group.each.setup(() => testUtils.db().truncate())

  test('GET /admin/reconciliations lists only the orders stuck awaiting payment', async ({
    client,
    assert,
  }) => {
    const admin = await UserFactory.apply('admin').merge({ phone: '081350000001' }).create()

    const stuck = await OrderFactory.apply('waitingPayment').merge({ totalPrice: 50000 }).create()
    await OrderFactory.apply('inCleaning').create()
    await OrderFactory.apply('completed').create()

    const response = await client.get('/admin/reconciliations').withInertia().loginAs(admin)

    response.assertInertiaComponent('admin/reconciliation/index')
    assert.lengthOf(response.inertiaProps.orders.data, 1)
    assert.equal(response.inertiaProps.orders.data[0].orderNumber, stuck.orderNumber)
  })

  test('the pending charge behind each order comes along', async ({ client, assert }) => {
    const admin = await UserFactory.apply('admin').merge({ phone: '081350001001' }).create()
    const order = await OrderFactory.apply('waitingPayment').merge({ totalPrice: 50000 }).create()
    await chargeFor(order)

    const response = await client.get('/admin/reconciliations').withInertia().loginAs(admin)

    const [row] = response.inertiaProps.orders.data
    assert.equal(row.transactions[0].status, TransactionStatus.PENDING)
    assert.equal(row.transactions[0].paymentMethod, PaymentMethod.QRIS)
  })

  test('the search matches the order number and the customer name', async ({ client, assert }) => {
    const admin = await UserFactory.apply('admin').merge({ phone: '081350002001' }).create()
    const order = await OrderFactory.apply('waitingPayment')
      .merge({ customerName: 'Siti Rahayu', totalPrice: 50000 })
      .create()
    await OrderFactory.apply('waitingPayment').merge({ customerName: 'Budi' }).create()

    for (const search of [order.orderNumber, 'Siti']) {
      const response = await client
        .get('/admin/reconciliations')
        .qs({ search })
        .withInertia()
        .loginAs(admin)

      assert.lengthOf(response.inertiaProps.orders.data, 1)
      assert.equal(response.inertiaProps.orders.data[0].orderNumber, order.orderNumber)
    }
  })

  /**
   * Settling the charge that is already pending, rather than adding a second
   * row beside it, keeps one payment looking like one payment.
   */
  test('confirming a payment settles the pending charge and moves the order on', async ({
    client,
    assert,
  }) => {
    const admin = await UserFactory.apply('admin').merge({ phone: '081350003001' }).create()
    const order = await OrderFactory.apply('waitingPayment').merge({ totalPrice: 50000 }).create()
    const charge = await chargeFor(order)

    const response = await client
      .put(`/admin/reconciliations/${order.orderNumber}`)
      .loginAs(admin)
      .json(override)
      .withCsrfToken()

    response.assertRedirectsTo('/admin/reconciliations')

    await order.refresh()
    assert.equal(order.status, OrderStatus.IN_CLEANING)

    await charge.refresh()
    assert.equal(charge.status, TransactionStatus.PAID)
    assert.equal(charge.paymentMethod, PaymentMethod.CASH)

    const transactions = await Transaction.query().where('orderId', order.id)
    assert.lengthOf(transactions, 1)
  })

  test('an order that was never charged gets a transaction of its own', async ({
    client,
    assert,
  }) => {
    const admin = await UserFactory.apply('admin').merge({ phone: '081350004001' }).create()
    const order = await OrderFactory.apply('waitingPayment').merge({ totalPrice: 50000 }).create()

    await client
      .put(`/admin/reconciliations/${order.orderNumber}`)
      .loginAs(admin)
      .json({ ...override, paymentMethod: PaymentMethod.DEBIT })
      .withCsrfToken()

    const transaction = await Transaction.query().where('orderId', order.id).firstOrFail()
    assert.equal(transaction.status, TransactionStatus.PAID)
    assert.equal(transaction.paymentMethod, PaymentMethod.DEBIT)
    assert.isNull(transaction.midtransOrderId)
  })

  /**
   * The override asserts money changed hands on nothing but an admin's word,
   * so who did it and why is the whole point of the record.
   */
  test('the override is recorded against the admin who made it', async ({ client, assert }) => {
    const admin = await UserFactory.apply('admin').merge({ phone: '081350005001' }).create()
    const order = await OrderFactory.apply('waitingPayment').merge({ totalPrice: 50000 }).create()

    await client
      .put(`/admin/reconciliations/${order.orderNumber}`)
      .loginAs(admin)
      .json(override)
      .withCsrfToken()

    const action = await OrderAction.query()
      .where('orderId', order.id)
      .where('name', ActionName.PAYMENT_OVERRIDE)
      .firstOrFail()

    assert.equal(action.staffId, admin.id)
    assert.equal(action.note, override.note)
  })

  test('a reason is required', async ({ client, assert }) => {
    const admin = await UserFactory.apply('admin').merge({ phone: '081350006001' }).create()
    const order = await OrderFactory.apply('waitingPayment').merge({ totalPrice: 50000 }).create()

    const response = await client
      .put(`/admin/reconciliations/${order.orderNumber}`)
      .withInertia()
      .loginAs(admin)
      .header('referer', '/admin/reconciliations')
      .fields({ paymentMethod: PaymentMethod.CASH })
      .withCsrfToken()

    response.assertInertiaPropsContains({ errors: { note: 'Catatan wajib diisi' } })

    await order.refresh()
    assert.equal(order.status, OrderStatus.AWAITING_PAYMENT)
  })

  test('an order that is not awaiting payment cannot be overridden', async ({ client, assert }) => {
    const admin = await UserFactory.apply('admin').merge({ phone: '081350007001' }).create()
    const order = await OrderFactory.apply('inCleaning').create()

    const response = await client
      .put(`/admin/reconciliations/${order.orderNumber}`)
      .withInertia()
      .loginAs(admin)
      .header('referer', '/admin/reconciliations')
      .json(override)
      .withCsrfToken()

    response.assertInertiaPropsContains({
      errors: { status: 'Pesanan ini tidak sedang menunggu pelunasan.' },
    })

    assert.lengthOf(await Transaction.query().where('orderId', order.id), 0)
  })

  test('an unknown order number is a 404', async ({ client }) => {
    const admin = await UserFactory.apply('admin').merge({ phone: '081350008001' }).create()

    const response = await client
      .put('/admin/reconciliations/ORD999999-001')
      .loginAs(admin)
      .json(override)
      .withCsrfToken()

    response.assertStatus(404)
  })

  /**
   * Overriding a payment state is exactly the kind of action that should be
   * rare, deliberate, and out of reach of the people running the shop floor.
   */
  test('staff cannot confirm a payment by hand', async ({ client, assert }) => {
    const staff = await UserFactory.apply('staff').merge({ phone: '081350009001' }).create()
    const order = await OrderFactory.apply('waitingPayment').merge({ totalPrice: 50000 }).create()

    const list = await client.get('/admin/reconciliations').withInertia().loginAs(staff)
    list.assertRedirectsTo('/staff/trips')

    const update = await client
      .put(`/admin/reconciliations/${order.orderNumber}`)
      .withInertia()
      .loginAs(staff)
      .json(override)
      .withCsrfToken()

    update.assertRedirectsTo('/staff/trips')

    await order.refresh()
    assert.equal(order.status, OrderStatus.AWAITING_PAYMENT)
  })
})
