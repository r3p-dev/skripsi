import { AddressFactory } from '#database/factories/address_factory'
import Service from '#models/service'
import { ServiceCategory, ServiceType } from '#enums/service_enum'
import { OrderFactory } from '#database/factories/order_factory'
import { UserFactory } from '#database/factories/user_factory'
import Order from '#models/order'
import OrderAction from '#models/order_action'
import Transaction from '#models/transaction'
import { ActionName } from '#enums/order_action_enum'
import { PaymentMethod, TransactionStatus } from '#enums/transaction_enum'
import testUtils from '@adonisjs/core/services/test_utils'
import { test } from '@japa/runner'
import { DateTime } from 'luxon'

/**
 * The calendar disables everything before today, so today itself is always
 * selectable and always inside the month on screen — no month navigation
 * needed regardless of when the suite runs.
 */
function todayCell() {
  return `td[data-day="${DateTime.now().toFormat('yyyy-MM-dd')}"] button`
}

/**
 * The price list on the booking page reads the real service catalogue, so a
 * service has to exist for it to render anything.
 */
function createService() {
  return Service.create({
    name: 'Cuci Sepatu Reguler',
    description: 'Cuci sepatu standar',
    category: ServiceCategory.SHOE_WASH,
    type: ServiceType.REGULAR,
    price: 30000,
  })
}

test.group('Customer Booking', (group) => {
  group.each.setup(() => testUtils.db().truncate())

  test('the booking page asks for an address before anything else', async ({
    visit,
    route,
    browserContext,
  }) => {
    const customer = await UserFactory.create()

    await browserContext.loginAs(customer)
    const page = await visit(route('customer.order.create'))

    await page.assertTextContains('body', 'Alamat belum tersedia')
    await page.assertExists(page.getByRole('link', { name: 'Tambah Alamat' }))
  })

  test('the booking page shows the pickup address and the price list', async ({
    visit,
    route,
    browserContext,
  }) => {
    const customer = await UserFactory.create()
    const address = await AddressFactory.merge({ userId: customer.id, isActive: true }).create()
    const service = await createService()

    await browserContext.loginAs(customer)
    const page = await visit(route('customer.order.create'))

    await page.assertTextContains('body', address.name)
    await page.assertTextContains('body', address.street)

    // The price list renders one collapsed accordion section per category.
    await page.assertTextContains('body', 'Cuci Sepatu')
    await page.getByRole('button', { name: 'Cuci Sepatu' }).click()

    await page.getByText(service.name).waitFor({ state: 'visible' })
    await page.assertTextContains('body', '30.000')

    await page.assertExists(page.getByRole('button', { name: 'Jadwalkan Penjemputan' }))
  })

  test('the submit button stays disabled until a pickup date is chosen', async ({
    visit,
    route,
    browserContext,
    assert,
  }) => {
    const customer = await UserFactory.create()
    await AddressFactory.merge({ userId: customer.id, isActive: true }).create()

    await browserContext.loginAs(customer)
    const page = await visit(route('customer.order.create'))

    const submit = page.getByRole('button', { name: 'Jadwalkan Penjemputan' })
    assert.isTrue(await submit.isDisabled())

    await page.locator(todayCell()).click()
    assert.isFalse(await submit.isDisabled())
  })

  test('a customer can book a pickup and lands on the new order', async ({
    visit,
    route,
    browserContext,
  }) => {
    const customer = await UserFactory.create()
    await AddressFactory.merge({ userId: customer.id, isActive: true }).create()

    await browserContext.loginAs(customer)
    const page = await visit(route('customer.order.create'))

    await page.locator(todayCell()).click()
    await page.getByRole('button', { name: 'Jadwalkan Penjemputan' }).click()

    await page.locator('[data-sonner-toast]').waitFor({ state: 'visible' })
    await page.assertTextContains('[data-sonner-toast]', 'Pesanan berhasil dibuat!')

    const order = await Order.query().where('user_id', customer.id).firstOrFail()

    await page.assertPath(`/orders/${order.orderNumber}`)
    await page.assertTextContains('body', order.orderNumber)
    await page.assertTextContains('body', 'Penjemputan Dijadwalkan')
  })
})

test.group('Customer Order History', (group) => {
  group.each.setup(() => testUtils.db().truncate())

  test('an empty history invites the customer to order', async ({
    visit,
    route,
    browserContext,
  }) => {
    const customer = await UserFactory.create()

    await browserContext.loginAs(customer)
    const page = await visit(route('customer.order.index'))

    await page.assertTextContains('body', 'Belum ada pesanan')
    await page.assertExists(page.getByRole('link', { name: 'Buat Pesanan' }))
  })

  test('the history lists the customer orders with their status', async ({
    visit,
    route,
    browserContext,
  }) => {
    const customer = await UserFactory.create()
    const order = await OrderFactory.merge({ userId: customer.id }).create()

    await browserContext.loginAs(customer)
    const page = await visit(route('customer.order.index'))

    await page.assertTextContains('body', order.orderNumber)
    await page.assertTextContains('body', 'Penjemputan Dijadwalkan')
  })

  test('searching narrows the history to the matching order', async ({
    visit,
    route,
    browserContext,
    assert,
  }) => {
    const customer = await UserFactory.create()
    const wanted = await OrderFactory.merge({
      userId: customer.id,
      orderNumber: 'ORD990101-777',
    }).create()
    const other = await OrderFactory.merge({
      userId: customer.id,
      orderNumber: 'ORD990101-888',
    }).create()

    await browserContext.loginAs(customer)
    const page = await visit(route('customer.order.index'))

    await page.getByPlaceholder('Cari nomor pesanan...').fill(wanted.orderNumber)
    await page.getByPlaceholder('Cari nomor pesanan...').press('Enter')

    await page.waitForURL(/search=/)

    await page.assertTextContains('body', wanted.orderNumber)
    assert.notInclude(await page.locator('body').innerText(), other.orderNumber)
  })

  test('the history pages through more than ten orders', async ({
    visit,
    route,
    browserContext,
  }) => {
    const customer = await UserFactory.create()
    await OrderFactory.merge({ userId: customer.id }).createMany(12)

    await browserContext.loginAs(customer)
    const page = await visit(route('customer.order.index'))

    await page.assertTextContains('body', '1 / 2')

    await page.getByRole('link', { name: 'Selanjutnya' }).click()
    await page.waitForURL(/page=2/)

    await page.assertTextContains('body', '2 / 2')
  })

  test('opening an order from the history keeps the customer in the app', async ({
    visit,
    route,
    browserContext,
  }) => {
    const customer = await UserFactory.create()
    const order = await OrderFactory.merge({ userId: customer.id }).create()

    await browserContext.loginAs(customer)
    const page = await visit(route('customer.order.index'))

    await page.getByText(order.orderNumber).click()

    await page.assertPath(`/orders/${order.orderNumber}`)
    await page.assertTextContains('body', 'Penjemputan Dijadwalkan')
  })
})

test.group('Customer Order Detail', (group) => {
  group.each.setup(() => testUtils.db().truncate())

  test('an order awaiting payment offers to pay', async ({ visit, route, browserContext }) => {
    const customer = await UserFactory.create()
    const order = await OrderFactory.apply('waitingPayment').merge({ userId: customer.id }).create()

    await browserContext.loginAs(customer)
    const page = await visit(route('customer.order.show', { number: order.orderNumber }))

    await page.assertTextContains('body', 'Menunggu Pelunasan')
    await page.assertExists(page.getByRole('button', { name: 'Bayar Sekarang' }))
  })

  test('a washed order compares the shoes before and after', async ({
    visit,
    route,
    browserContext,
    assert,
  }) => {
    const customer = await UserFactory.merge({ phone: '081200000401' }).create()
    const staff = await UserFactory.apply('staff').merge({ phone: '081200000402' }).create()
    const order = await OrderFactory.apply('inDelivery').merge({ userId: customer.id }).create()

    await OrderAction.create({
      orderId: order.id,
      staffId: staff.id,
      name: ActionName.INSPECTION,
      photoPath: 'https://example.test/before.png',
      note: null,
    })
    await OrderAction.create({
      orderId: order.id,
      staffId: staff.id,
      name: ActionName.CLEANING_DONE,
      photoPath: 'https://example.test/after.png',
      note: null,
    })

    await browserContext.loginAs(customer)
    const page = await visit(route('customer.order.show', { number: order.orderNumber }))

    const slider = page.getByRole('slider')
    await slider.waitFor({ state: 'visible' })

    assert.equal(
      await page.getByAltText('Sebelum').getAttribute('src'),
      'https://example.test/before.png'
    )
    assert.equal(
      await page.getByAltText('Sesudah').getAttribute('src'),
      'https://example.test/after.png'
    )
  })

  test('an order that is still being washed has nothing to compare yet', async ({
    visit,
    route,
    browserContext,
    assert,
  }) => {
    const customer = await UserFactory.merge({ phone: '081200000403' }).create()
    const staff = await UserFactory.apply('staff').merge({ phone: '081200000404' }).create()
    const order = await OrderFactory.apply('inCleaning').merge({ userId: customer.id }).create()

    // Only the "before" exists until the batch is marked washed.
    await OrderAction.create({
      orderId: order.id,
      staffId: staff.id,
      name: ActionName.INSPECTION,
      photoPath: 'https://example.test/before.png',
      note: null,
    })

    await browserContext.loginAs(customer)
    const page = await visit(route('customer.order.show', { number: order.orderNumber }))

    // The inspection photo still shows in the progress list, just not as a pair.
    await page.getByAltText('Inspeksi').waitFor({ state: 'visible' })
    assert.equal(await page.getByRole('slider').count(), 0)
  })

  test('a cancellable order offers a working cancel button', async ({
    visit,
    route,
    browserContext,
    assert,
  }) => {
    const customer = await UserFactory.create()
    const order = await OrderFactory.merge({
      userId: customer.id,
      pickupDate: DateTime.now().plus({ days: 3 }),
    }).create()

    await browserContext.loginAs(customer)
    const page = await visit(route('customer.order.show', { number: order.orderNumber }))

    const cancel = page.getByRole('button', { name: 'Batalkan Pesanan' })
    assert.isFalse(await cancel.isDisabled())

    await cancel.click()

    await page.locator('[data-sonner-toast]').waitFor({ state: 'visible' })
    await page.assertTextContains('[data-sonner-toast]', 'Pesanan berhasil dibatalkan.')
    await page.assertTextContains('body', 'Dibatalkan')

    await order.refresh()
    assert.equal(order.status, 'cancelled')
  })

  test('an order past its pickup day shows the cancel button disabled', async ({
    visit,
    route,
    browserContext,
    assert,
  }) => {
    const customer = await UserFactory.create()
    const order = await OrderFactory.merge({
      userId: customer.id,
      pickupDate: DateTime.now(),
    }).create()

    await browserContext.loginAs(customer)
    const page = await visit(route('customer.order.show', { number: order.orderNumber }))

    const cancel = page.getByRole('button', { name: 'Batalkan Pesanan' })
    assert.isTrue(await cancel.isDisabled())

    await page.assertTextContains(
      'body',
      'Pesanan hanya dapat dibatalkan sebelum tanggal penjemputan.'
    )
  })

  test('an already collected order shows the cancel button disabled', async ({
    visit,
    route,
    browserContext,
    assert,
  }) => {
    const customer = await UserFactory.create()
    const order = await OrderFactory.apply('inInspection')
      .merge({ userId: customer.id, pickupDate: DateTime.now().plus({ days: 3 }) })
      .create()

    await browserContext.loginAs(customer)
    const page = await visit(route('customer.order.show', { number: order.orderNumber }))

    assert.isTrue(await page.getByRole('button', { name: 'Batalkan Pesanan' }).isDisabled())
  })

  test('the receipt opens from the order detail', async ({ visit, route, browserContext }) => {
    const customer = await UserFactory.create()
    const order = await OrderFactory.apply('completed').merge({ userId: customer.id }).create()

    await browserContext.loginAs(customer)
    const page = await visit(route('customer.order.show', { number: order.orderNumber }))

    await page.getByRole('link', { name: 'Lihat Struk' }).click()

    await page.assertPath(`/orders/${order.orderNumber}/receipt`)
    await page.assertTextContains('body', 'Struk Pesanan')
    await page.assertTextContains('body', order.orderNumber)
    await page.assertTextContains('body', 'UmimaClean')
  })
})

test.group('Customer Payment Page', (group) => {
  group.each.setup(() => testUtils.db().truncate())

  test('a pending payment shows the QR code and waits for confirmation', async ({
    visit,
    route,
    browserContext,
  }) => {
    const customer = await UserFactory.create()
    const order = await OrderFactory.apply('waitingPayment').merge({ userId: customer.id }).create()

    await Transaction.create({
      orderId: order.id,
      paymentMethod: PaymentMethod.QRIS,
      midtransOrderId: `${order.orderNumber}-1`,
      midtransTransactionId: 'trx-1',
      status: TransactionStatus.PENDING,
      qrCode: 'https://example.test/qr.png',
    })

    await browserContext.loginAs(customer)
    const page = await visit(route('customer.transaction.show', { number: order.orderNumber }))

    await page.assertTextContains('body', 'Menunggu pembayaran...')
    await page.assertExists(page.getByAltText('Kode QRIS'))
  })

  test('an expired payment offers to start a new one', async ({ visit, route, browserContext }) => {
    const customer = await UserFactory.create()
    const order = await OrderFactory.apply('waitingPayment').merge({ userId: customer.id }).create()

    await Transaction.create({
      orderId: order.id,
      paymentMethod: PaymentMethod.QRIS,
      midtransOrderId: `${order.orderNumber}-2`,
      midtransTransactionId: 'trx-2',
      status: TransactionStatus.EXPIRED,
      qrCode: null,
    })

    await browserContext.loginAs(customer)
    const page = await visit(route('customer.transaction.show', { number: order.orderNumber }))

    await page.assertTextContains('body', 'Kedaluarsa')
    await page.assertExists(page.getByRole('button', { name: 'Buat Pembayaran Baru' }))
  })

  test('a paid order confirms the payment succeeded', async ({ visit, route, browserContext }) => {
    const customer = await UserFactory.create()
    const order = await OrderFactory.apply('inCleaning').merge({ userId: customer.id }).create()

    await Transaction.create({
      orderId: order.id,
      paymentMethod: PaymentMethod.QRIS,
      midtransOrderId: `${order.orderNumber}-3`,
      midtransTransactionId: 'trx-3',
      status: TransactionStatus.PAID,
      qrCode: null,
    })

    await browserContext.loginAs(customer)
    const page = await visit(route('customer.transaction.show', { number: order.orderNumber }))

    await page.assertTextContains('body', 'Pembayaran Berhasil')
    await page.assertExists(page.getByRole('link', { name: 'Kembali ke Pesanan' }))
  })
})
