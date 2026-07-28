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

function payFor(
  order: Order,
  paymentMethod: PaymentMethod = PaymentMethod.CASH,
  status: TransactionStatus = TransactionStatus.PAID
) {
  return Transaction.create({
    orderId: order.id,
    paymentMethod,
    midtransOrderId: null,
    midtransTransactionId: null,
    status,
    qrCode: null,
  })
}

test.group('Admin Report', (group) => {
  group.each.setup(() => testUtils.db().truncate())

  test('GET /admin/reports totals the revenue that was actually collected', async ({
    client,
    assert,
  }) => {
    const admin = await UserFactory.apply('admin').merge({ phone: '081340000001' }).create()

    const paid = await OrderFactory.merge({ status: OrderStatus.COMPLETED, totalPrice: 80000 }).create()
    await payFor(paid)

    const unpaid = await OrderFactory.merge({ status: OrderStatus.AWAITING_PAYMENT, totalPrice: 50000 }).create()
    await payFor(unpaid, PaymentMethod.QRIS, TransactionStatus.PENDING)

    const response = await client.get('/admin/reports').withInertia().loginAs(admin)

    response.assertInertiaComponent('admin/report/index')
    assert.equal(response.inertiaProps.report.totalRevenueValue, 80000)
    assert.equal(response.inertiaProps.report.paidOrders, 1)
  })

  test('the average order value is the revenue over the paid orders', async ({
    client,
    assert,
  }) => {
    const admin = await UserFactory.apply('admin').merge({ phone: '081340001001' }).create()

    for (const totalPrice of [40000, 60000]) {
      const order = await OrderFactory.merge({
        status: OrderStatus.COMPLETED,
        totalPrice,
      }).create()
      await payFor(order)
    }

    const response = await client.get('/admin/reports').withInertia().loginAs(admin)

    assert.equal(response.inertiaProps.report.paidOrders, 2)
    assert.equal(response.inertiaProps.report.averageOrderValue, formatRupiah(50000))
  })

  test('an empty range reports zero rather than dividing by nothing', async ({
    client,
    assert,
  }) => {
    const admin = await UserFactory.apply('admin').merge({ phone: '081340001002' }).create()

    const response = await client.get('/admin/reports').withInertia().loginAs(admin)

    assert.equal(response.inertiaProps.report.totalRevenueValue, 0)
    assert.equal(response.inertiaProps.report.paidOrders, 0)
    assert.equal(response.inertiaProps.report.averageOrderValue, formatRupiah(0))
  })

  test('the payment mix names every method, including the unused ones', async ({
    client,
    assert,
  }) => {
    const admin = await UserFactory.apply('admin').merge({ phone: '081340002001' }).create()

    const cash = await OrderFactory.merge({ status: OrderStatus.COMPLETED, totalPrice: 30000 }).create()
    await payFor(cash, PaymentMethod.CASH)

    const qris = await OrderFactory.merge({ status: OrderStatus.COMPLETED, totalPrice: 70000 }).create()
    await payFor(qris, PaymentMethod.QRIS)

    const response = await client.get('/admin/reports').withInertia().loginAs(admin)

    const mix = response.inertiaProps.report.byPaymentMethod
    assert.lengthOf(mix, 3)
    assert.equal(mix.find((row: { value: string }) => row.value === 'cash').revenueValue, 30000)
    assert.equal(mix.find((row: { value: string }) => row.value === 'qris').revenueValue, 70000)
    assert.equal(mix.find((row: { value: string }) => row.value === 'debit').revenueValue, 0)
  })

  test('the type split separates walk-in revenue from app bookings', async ({ client, assert }) => {
    const admin = await UserFactory.apply('admin').merge({ phone: '081340003001' }).create()

    const online = await OrderFactory.merge({ status: OrderStatus.COMPLETED, totalPrice: 40000 }).create()
    await payFor(online)

    const walkIn = await OrderFactory.apply('offline')
      .merge({ status: OrderStatus.COMPLETED, totalPrice: 25000 })
      .create()
    await payFor(walkIn)

    const response = await client.get('/admin/reports').withInertia().loginAs(admin)

    const byType = response.inertiaProps.report.byType
    assert.equal(byType.find((row: { value: string }) => row.value === 'online').revenueValue, 40000)
    assert.equal(
      byType.find((row: { value: string }) => row.value === 'offline').revenueValue,
      25000
    )
  })

  /**
   * Ranked by what the lines actually charged, not by the catalogue's current
   * price, so a later price change never rewrites history.
   */
  test('the top services are ranked by the revenue they earned', async ({ client, assert }) => {
    const admin = await UserFactory.apply('admin').merge({ phone: '081340004001' }).create()

    const premium = await Service.create({
      name: 'Deep Clean Premium',
      description: 'Perawatan khusus',
      category: ServiceCategory.SHOE_WASH,
      type: ServiceType.REGULAR,
      price: 75000,
    })
    const regular = await Service.create({
      name: 'Cuci Sepatu Reguler',
      description: 'Cuci standar',
      category: ServiceCategory.SHOE_WASH,
      type: ServiceType.REGULAR,
      price: 30000,
    })

    const order = await OrderFactory.merge({ status: OrderStatus.COMPLETED, totalPrice: 105000 }).create()
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

    for (const service of [premium, regular]) {
      await OrderItem.create({
        orderId: order.id,
        itemId: item.id,
        serviceId: service.id,
        name: `${service.name} - Nike Air Max`,
        price: Number(service.price),
        subtotal: Number(service.price),
      })
    }

    const response = await client.get('/admin/reports').withInertia().loginAs(admin)

    const top = response.inertiaProps.report.topServices
    assert.equal(top[0].name, 'Deep Clean Premium')
    assert.equal(top[0].revenueValue, 75000)
    assert.equal(top[1].name, 'Cuci Sepatu Reguler')
  })

  test('the range from the query string is what gets reported', async ({ client, assert }) => {
    const admin = await UserFactory.apply('admin').merge({ phone: '081340005001' }).create()

    const response = await client
      .get('/admin/reports')
      .qs({ from: '2026-07-01', to: '2026-07-10' })
      .withInertia()
      .loginAs(admin)

    assert.equal(response.inertiaProps.report.from, '2026-07-01')
    assert.equal(response.inertiaProps.report.to, '2026-07-10')
    assert.lengthOf(response.inertiaProps.report.series, 10)
  })

  test('orders outside the range are left out', async ({ client, assert }) => {
    const admin = await UserFactory.apply('admin').merge({ phone: '081340006001' }).create()

    const order = await OrderFactory.merge({ status: OrderStatus.COMPLETED, totalPrice: 80000 }).create()
    await payFor(order)

    const lastMonth = DateTime.now().minus({ months: 2 })

    const response = await client
      .get('/admin/reports')
      .qs({ from: lastMonth.toISODate(), to: lastMonth.plus({ days: 5 }).toISODate() })
      .withInertia()
      .loginAs(admin)

    assert.equal(response.inertiaProps.report.totalRevenueValue, 0)
  })

  test('a report with no dates defaults to the last 30 days', async ({ client, assert }) => {
    const admin = await UserFactory.apply('admin').merge({ phone: '081340007001' }).create()

    const response = await client.get('/admin/reports').withInertia().loginAs(admin)

    assert.lengthOf(response.inertiaProps.report.series, 30)
    assert.equal(response.inertiaProps.report.to, DateTime.now().toISODate())
  })

  test('staff cannot reach the report', async ({ client }) => {
    const staff = await UserFactory.apply('staff').merge({ phone: '081340008001' }).create()

    const response = await client.get('/admin/reports').withInertia().loginAs(staff)

    response.assertRedirectsTo('/staff/trips')
  })
})
