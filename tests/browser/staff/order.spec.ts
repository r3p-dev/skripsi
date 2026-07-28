import { UserFactory } from '#database/factories/user_factory'
import { OrderFactory } from '#database/factories/order_factory'
import Item from '#models/item'
import Order from '#models/order'
import OrderItem from '#models/order_item'
import Transaction from '#models/transaction'
import Service from '#models/service'
import { ItemType, ServiceCategory, ServiceType } from '#enums/service_enum'
import testUtils from '@adonisjs/core/services/test_utils'
import { test } from '@japa/runner'
import { fileURLToPath } from 'node:url'

const photoPath = fileURLToPath(new URL('../../fixtures/photo.png', import.meta.url))

function createMainService() {
  return Service.create({
    name: 'Cuci Sepatu Reguler',
    description: 'Cuci sepatu standar',
    category: ServiceCategory.SHOE_WASH,
    type: ServiceType.REGULAR,
    price: 30000,
  })
}

function createBagService() {
  return Service.create({
    name: 'Cuci Tas Reguler',
    description: 'Cuci tas standar',
    category: ServiceCategory.BAG_WASH,
    type: ServiceType.REGULAR,
    price: 25000,
  })
}

/**
 * Fills the physical details of one item card. The service is chosen
 * separately because it is what derives the item's type.
 */
async function fillItemFields(
  page: any,
  index: number,
  details: { brand: string; model: string; material: string; size: string; condition: string }
) {
  await page.locator(`input[name="items[${index}][brand]"]`).fill(details.brand)
  await page.locator(`input[name="items[${index}][model]"]`).fill(details.model)
  await page.locator(`input[name="items[${index}][material]"]`).fill(details.material)
  await page.locator(`input[name="items[${index}][size]"]`).fill(details.size)
  await page.locator(`input[name="items[${index}][condition]"]`).fill(details.condition)
}

test.group('Staff Offline Order', (group) => {
  group.each.setup(() => testUtils.db().truncate())

  test('staff can create an offline order and take a cash payment', async ({
    visit,
    route,
    browserContext,
    assert,
  }) => {
    const staff = await UserFactory.apply('staff').create()
    const service = await createMainService()

    await browserContext.loginAs(staff)
    const page = await visit(route('staff.order.create'))

    await page.assertTextContains('body', 'Pesanan Baru')

    await page.getByLabel('Nama Pelanggan').fill('Budi')
    await page.getByLabel('Nomor Telepon').fill('081211119001')
    await page.locator('input[name="items[0][brand]"]').fill('Nike')
    await page.locator('input[name="items[0][model]"]').fill('Air Max')
    await page.locator('input[name="items[0][material]"]').fill('Kanvas')
    await page.locator('input[name="items[0][size]"]').fill('42')
    await page.locator('input[name="items[0][condition]"]').fill('Kotor ringan')
    await page.locator('select[name="items[0][service]"]').selectOption(String(service.id))
    await page.locator('select[name="paymentMethod"]').selectOption('cash')

    await page.getByRole('button', { name: 'Buat Pesanan' }).click()

    await page.assertPath('/staff/trips')
    await page.locator('[data-sonner-toast]').waitFor({ state: 'visible' })
    await page.assertTextContains('[data-sonner-toast]', 'Pesanan offline berhasil dibuat.')

    const order = await Order.query().where('customerPhone', '081211119001').firstOrFail()
    assert.equal(order.status, 'in_cleaning')

    const transaction = await Transaction.query().where('orderId', order.id).firstOrFail()
    assert.equal(transaction.paymentMethod, 'cash')
    assert.equal(transaction.status, 'paid')
  })

  test('the plus button on the queue opens the walk-in form', async ({
    visit,
    route,
    browserContext,
  }) => {
    const staff = await UserFactory.apply('staff').merge({ phone: '081211119010' }).create()
    await createMainService()

    await browserContext.loginAs(staff)
    const page = await visit(route('staff.trip.index'))

    await page.getByLabel('Buat pesanan offline').click()

    await page.assertPath('/staff/orders/create')
    await page.assertTextContains('body', 'Pesanan Baru')
  })

  test('a walk-in order is recorded as offline, with no account and nowhere to deliver', async ({
    visit,
    route,
    browserContext,
    assert,
  }) => {
    const staff = await UserFactory.apply('staff').merge({ phone: '081211119011' }).create()
    const service = await createMainService()

    await browserContext.loginAs(staff)
    const page = await visit(route('staff.order.create'))

    await page.getByLabel('Nama Pelanggan').fill('Siti')
    await page.getByLabel('Nomor Telepon').fill('081211119002')
    await fillItemFields(page, 0, {
      brand: 'Adidas',
      model: 'Samba',
      material: 'Suede',
      size: '40',
      condition: 'Kotor berat',
    })
    await page.locator('select[name="items[0][service]"]').selectOption(String(service.id))
    await page.locator('textarea[name="note"]').fill('Diambil sendiri di toko')
    await page.locator('select[name="paymentMethod"]').selectOption('debit')

    await page.getByRole('button', { name: 'Buat Pesanan' }).click()

    await page.assertPath('/staff/trips')

    const order = await Order.query().where('customerPhone', '081211119002').firstOrFail()
    assert.equal(order.type, 'offline')
    assert.equal(order.customerName, 'Siti')

    // No account to track it with, and nothing to deliver — the customer collects it.
    assert.isNull(order.userId)
    assert.isNull(order.addressId)
  })

  test('a second item added to the form is priced along with the first', async ({
    visit,
    route,
    browserContext,
    assert,
  }) => {
    const staff = await UserFactory.apply('staff').merge({ phone: '081211119012' }).create()
    const shoeService = await createMainService()
    const bagService = await createBagService()

    await browserContext.loginAs(staff)
    const page = await visit(route('staff.order.create'))

    await page.getByLabel('Nama Pelanggan').fill('Rian')
    await page.getByLabel('Nomor Telepon').fill('081211119003')

    await fillItemFields(page, 0, {
      brand: 'Nike',
      model: 'Air Max',
      material: 'Kanvas',
      size: '42',
      condition: 'Kotor ringan',
    })
    await page.locator('select[name="items[0][service]"]').selectOption(String(shoeService.id))

    await page.getByRole('button', { name: 'Tambah Barang' }).click()

    await fillItemFields(page, 1, {
      brand: 'Eiger',
      model: 'Backpack',
      material: 'Nylon',
      size: 'M',
      condition: 'Berjamur',
    })
    await page.locator('select[name="items[1][service]"]').selectOption(String(bagService.id))

    await page.locator('select[name="paymentMethod"]').selectOption('cash')
    await page.getByRole('button', { name: 'Buat Pesanan' }).click()

    await page.assertPath('/staff/trips')

    const order = await Order.query().where('customerPhone', '081211119003').firstOrFail()
    assert.equal(Number(order.totalPrice), 55000)

    // Each item's type came from the category of the service picked for it.
    const items = await OrderItem.query().where('orderId', order.id).preload('item').orderBy('id')
    assert.lengthOf(items, 2)
    assert.equal(items[0].item.type, 'shoe')
    assert.equal(items[1].item.type, 'bag')
  })

  test('a QRIS walk-in lands on the QR page for the customer to scan', async ({
    visit,
    route,
    browserContext,
    assert,
  }) => {
    const staff = await UserFactory.apply('staff').merge({ phone: '081211119013' }).create()
    const service = await createMainService()

    await browserContext.loginAs(staff)
    const page = await visit(route('staff.order.create'))

    await page.getByLabel('Nama Pelanggan').fill('Yuni')
    await page.getByLabel('Nomor Telepon').fill('081211119004')
    await fillItemFields(page, 0, {
      brand: 'Converse',
      model: 'Chuck 70',
      material: 'Kanvas',
      size: '39',
      condition: 'Kotor ringan',
    })
    await page.locator('select[name="items[0][service]"]').selectOption(String(service.id))
    await page.locator('select[name="paymentMethod"]').selectOption('qris')

    await page.getByRole('button', { name: 'Buat Pesanan' }).click()

    /**
     * Charging the Midtrans sandbox takes a few seconds, so wait for the QR page
     * before looking in the database — otherwise the assertions race the request
     * that is still creating the order.
     */
    await page.waitForURL(/\/staff\/orders\/.+\/transactions\/latest$/, { timeout: 45000 })

    const order = await Order.query().where('customerPhone', '081211119004').firstOrFail()
    await page.assertPath(`/staff/orders/${order.orderNumber}/transactions/latest`)

    const transaction = await Transaction.query().where('orderId', order.id).firstOrFail()
    assert.equal(transaction.status, 'pending')
    assert.isNotNull(transaction.qrCode)

    await page.assertExists(page.locator(`img[src="${transaction.qrCode}"]`))
  }).timeout(60000)
})

test.group('Staff Order Item Editing', (group) => {
  group.each.setup(() => testUtils.db().truncate())

  test('completing an inspection opens the correction form filled with what was typed', async ({
    visit,
    route,
    browserContext,
    assert,
  }) => {
    const staff = await UserFactory.apply('staff').merge({ phone: '081211119020' }).create()
    const order = await OrderFactory.apply('inInspection').create()
    const service = await createMainService()
    const premiumService = await Service.create({
      name: 'Cuci Sepatu Premium',
      description: 'Cuci sepatu menyeluruh',
      category: ServiceCategory.SHOE_WASH,
      type: ServiceType.REGULAR,
      price: 75000,
    })

    await browserContext.loginAs(staff)
    const inspection = await visit(route('staff.inspection.show', { number: order.orderNumber }))

    await fillItemFields(inspection, 0, {
      brand: 'Nikee',
      model: 'Air Max',
      material: 'Kanvas',
      size: '42',
      condition: 'Kotor ringan',
    })
    await inspection.locator('select[name="items[0][service]"]').selectOption(String(service.id))
    await inspection.locator('input[type="file"]').setInputFiles(photoPath)
    await inspection.getByRole('button', { name: 'Selesaikan Inspeksi' }).click()

    await inspection.assertPath(`/staff/orders/${order.orderNumber}/items`)

    // The typo is sitting in the form, ready to be corrected.
    const brand = inspection.locator('input[name="items[0][brand]"]')
    await brand.waitFor({ state: 'attached' })
    assert.equal(await brand.inputValue(), 'Nikee')
    assert.equal(
      await inspection.locator('select[name="items[0][service]"]').inputValue(),
      String(service.id)
    )

    await brand.fill('Nike')
    await inspection
      .locator('select[name="items[0][service]"]')
      .selectOption(String(premiumService.id))
    await inspection.getByRole('button', { name: 'Simpan Barang' }).click()

    await inspection.assertPath('/staff/trips')

    await order.refresh()
    assert.equal(Number(order.totalPrice), 75000)

    const items = await OrderItem.query().where('orderId', order.id).preload('item')
    assert.lengthOf(items, 1)
    assert.equal(items[0].item.brand, 'Nike')
  })

  test('the correction form can be left without changing anything', async ({
    visit,
    route,
    browserContext,
    assert,
  }) => {
    const staff = await UserFactory.apply('staff').merge({ phone: '081211119021' }).create()
    const service = await createMainService()
    const order = await OrderFactory.apply('waitingPayment').create()

    const item = await Item.create({
      type: ItemType.SHOE,
      brand: 'Nike',
      model: 'Air Max',
      material: 'Kanvas',
      size: '42',
      condition: 'Kotor ringan',
      note: null,
    })
    await OrderItem.create({
      orderId: order.id,
      itemId: item.id,
      serviceId: service.id,
      name: `${service.name} - ${item.brand} ${item.model}`,
      price: 30000,
      subtotal: 30000,
    })

    await browserContext.loginAs(staff)
    const page = await visit(route('staff.order.edit', { number: order.orderNumber }))

    await page.getByRole('link', { name: 'Sudah Benar' }).click()

    await page.assertPath('/staff/trips')

    const items = await OrderItem.query().where('orderId', order.id)
    assert.lengthOf(items, 1)
    assert.equal(items[0].itemId, item.id)
  })
})
