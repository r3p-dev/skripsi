import { OrderFactory } from '#database/factories/order_factory'
import { UserFactory } from '#database/factories/user_factory'
import { OrderStatus } from '#enums/order_status_enum'
import { PaymentMethod, TransactionStatus } from '#enums/transaction_enum'
import Order from '#models/order'
import Transaction from '#models/transaction'
import testUtils from '@adonisjs/core/services/test_utils'
import { test } from '@japa/runner'
import { DateTime } from 'luxon'

function payFor(order: Order, status: TransactionStatus = TransactionStatus.PAID) {
  return Transaction.create({
    orderId: order.id,
    paymentMethod: PaymentMethod.CASH,
    midtransOrderId: null,
    midtransTransactionId: null,
    status,
    qrCode: null,
  })
}

test.group('Admin Dashboard', (group) => {
  group.each.setup(() => testUtils.db().truncate())

  test('GET /admin/dashboard summarises orders, revenue and accounts', async ({
    client,
    assert,
  }) => {
    const admin = await UserFactory.apply('admin').merge({ phone: '081300000001' }).create()
    await UserFactory.merge({ phone: '081300000002' }).create()
    await UserFactory.apply('staff').merge({ phone: '081300000003' }).create()

    const paid = await OrderFactory.merge({ status: OrderStatus.COMPLETED, totalPrice: 80000 }).create()
    await payFor(paid)
    await OrderFactory.merge({ status: OrderStatus.AWAITING_PAYMENT, totalPrice: 50000 }).create()

    const response = await client.get('/admin/dashboard').withInertia().loginAs(admin)

    response.assertInertiaComponent('admin/index')

    const { summary } = response.inertiaProps
    assert.equal(summary.totalOrders, 2)
    assert.equal(summary.completedOrders, 1)
    assert.equal(summary.awaitingPayment, 1)
    assert.equal(summary.activeOrders, 1)
    assert.equal(summary.customers, 1)
    assert.equal(summary.staff, 1)
  })

  /**
   * An order still awaiting payment is work in progress, not money. Counting
   * it would overstate every revenue figure on the page.
   */
  test('revenue only counts orders with a paid transaction', async ({ client, assert }) => {
    const admin = await UserFactory.apply('admin').merge({ phone: '081300001001' }).create()

    const paid = await OrderFactory.merge({ status: OrderStatus.COMPLETED, totalPrice: 80000 }).create()
    await payFor(paid)

    const pending = await OrderFactory.merge({ status: OrderStatus.AWAITING_PAYMENT, totalPrice: 50000 }).create()
    await payFor(pending, TransactionStatus.PENDING)

    const response = await client.get('/admin/dashboard').withInertia().loginAs(admin)

    assert.equal(response.inertiaProps.summary.revenueValue, 80000)
  })

  /**
   * A QRIS charge that expired and was retried leaves two transaction rows
   * against one order, but only one payment ever changed hands.
   */
  test('an order charged twice is not counted twice', async ({ client, assert }) => {
    const admin = await UserFactory.apply('admin').merge({ phone: '081300001002' }).create()

    const order = await OrderFactory.merge({ status: OrderStatus.COMPLETED, totalPrice: 80000 }).create()
    await payFor(order)
    await payFor(order)

    const response = await client.get('/admin/dashboard').withInertia().loginAs(admin)

    assert.equal(response.inertiaProps.summary.revenueValue, 80000)
  })

  test('the status breakdown lists every status, including the empty ones', async ({
    client,
    assert,
  }) => {
    const admin = await UserFactory.apply('admin').merge({ phone: '081300002001' }).create()
    await OrderFactory.apply('inCleaning').create()

    const response = await client.get('/admin/dashboard').withInertia().loginAs(admin)

    const breakdown = response.inertiaProps.statusBreakdown
    assert.lengthOf(breakdown, 8)

    const cleaning = breakdown.find((slice: { value: string }) => slice.value === 'in_cleaning')
    assert.equal(cleaning.total, 1)
    assert.equal(cleaning.label, 'Dalam Pencucian')

    const cancelled = breakdown.find((slice: { value: string }) => slice.value === 'cancelled')
    assert.equal(cancelled.total, 0)
  })

  test('the type split separates walk-ins from app bookings', async ({ client, assert }) => {
    const admin = await UserFactory.apply('admin').merge({ phone: '081300003001' }).create()
    await OrderFactory.createMany(2)
    await OrderFactory.apply('offline').create()

    const response = await client.get('/admin/dashboard').withInertia().loginAs(admin)

    const split = response.inertiaProps.typeSplit
    assert.equal(split.find((slice: { value: string }) => slice.value === 'online').total, 2)
    assert.equal(split.find((slice: { value: string }) => slice.value === 'offline').total, 1)
  })

  test('the revenue trend has a point for every day, quiet ones included', async ({
    client,
    assert,
  }) => {
    const admin = await UserFactory.apply('admin').merge({ phone: '081300004001' }).create()

    const order = await OrderFactory.merge({ status: OrderStatus.COMPLETED, totalPrice: 60000 }).create()
    await payFor(order)

    const response = await client.get('/admin/dashboard').withInertia().loginAs(admin)

    const trend = response.inertiaProps.revenueTrend
    assert.lengthOf(trend, 14)
    assert.equal(trend.at(-1).date, DateTime.now().toISODate())
    assert.equal(trend.at(-1).total, 60000)
    assert.equal(trend[0].total, 0)
  })

  test('the pickup load counts scheduled pickups against the daily cap', async ({
    client,
    assert,
  }) => {
    const admin = await UserFactory.apply('admin').merge({ phone: '081300005001' }).create()
    const tomorrow = DateTime.now().plus({ days: 1 }).startOf('day')

    await OrderFactory.merge({ pickupDate: tomorrow }).createMany(3)

    const response = await client.get('/admin/dashboard').withInertia().loginAs(admin)

    const load = response.inertiaProps.pickupLoad
    assert.lengthOf(load, 7)

    const day = load.find((entry: { date: string }) => entry.date === tomorrow.toISODate())
    assert.equal(day.booked, 3)
    assert.equal(day.capacity, 10)
  })

  test('the recent order list is newest first and capped at five', async ({ client, assert }) => {
    const admin = await UserFactory.apply('admin').merge({ phone: '081300006001' }).create()
    await OrderFactory.createMany(7)

    const response = await client.get('/admin/dashboard').withInertia().loginAs(admin)

    assert.lengthOf(response.inertiaProps.recentOrders, 5)
  })
})
