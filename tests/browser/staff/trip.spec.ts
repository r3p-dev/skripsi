import { UserFactory } from '#database/factories/user_factory'
import { OrderFactory } from '#database/factories/order_factory'
import { AddressFactory } from '#database/factories/address_factory'
import Item from '#models/item'
import type Order from '#models/order'
import OrderAction from '#models/order_action'
import OrderItem from '#models/order_item'
import Service from '#models/service'
import { ItemType, ServiceCategory, ServiceType } from '#enums/service_enum'
import { OrderStatus } from '#enums/order_status_enum'
import testUtils from '@adonisjs/core/services/test_utils'
import { test } from '@japa/runner'
import { fileURLToPath } from 'node:url'
import { DateTime } from 'luxon'

const photoPath = fileURLToPath(new URL('../../fixtures/photo.png', import.meta.url))

/**
 * A pickup due today with somewhere to actually drive to, which is what the
 * map card and the directions link need.
 */
async function createPickupWithAddress(customerPhone: string) {
  const customer = await UserFactory.merge({ phone: customerPhone }).create()
  const address = await AddressFactory.merge({ userId: customer.id, isActive: true }).create()

  const order = await OrderFactory.merge({
    userId: customer.id,
    addressId: address.id,
    pickupDate: DateTime.now(),
  }).create()

  return { order, address }
}

test.group('Staff Trip Queue', (group) => {
  group.each.setup(() => testUtils.db().truncate())

  test('staff can see a pickup order in the queue and open it', async ({
    visit,
    route,
    browserContext,
  }) => {
    const staff = await UserFactory.apply('staff').create()
    const order = await OrderFactory.merge({ pickupDate: DateTime.now() }).create()

    await browserContext.loginAs(staff)
    const page = await visit(route('staff.trip.index'))

    await page.assertPath('/staff/trips')
    await page.assertTextContains('body', order.orderNumber)

    // Claiming holds the stop against everyone else for three hours, so the
    // card asks before it opens the task.
    await page.getByText(order.orderNumber).click()
    await page.getByRole('link', { name: 'Ambil Tugas' }).click()

    await page.assertPath(`/staff/trips/${order.orderNumber}/pickup`)
    await page.getByLabel('Foto Bukti Penjemputan').waitFor({ state: 'attached' })
  })

  test('a task blocked by another staff shows a locked message instead of the form', async ({
    visit,
    route,
    browserContext,
  }) => {
    const staffA = await UserFactory.apply('staff').merge({ phone: '081200000201' }).create()
    const staffB = await UserFactory.apply('staff').merge({ phone: '081200000202' }).create()
    const order = await OrderFactory.create()

    await browserContext.loginAs(staffA)
    await visit(route('staff.trip.show', { number: order.orderNumber, type: 'pickup' }))

    await browserContext.loginAs(staffB)
    const page = await visit(
      route('staff.trip.show', { number: order.orderNumber, type: 'pickup' })
    )

    await page.assertTextContains('body', 'Sedang diproses petugas lain')
  })
})

test.group('Staff Trip Completion', (group) => {
  group.each.setup(() => testUtils.db().truncate())

  test('staff can complete a pickup by uploading a proof photo', async ({
    visit,
    route,
    browserContext,
    assert,
  }) => {
    const staff = await UserFactory.apply('staff').create()
    const order = await OrderFactory.create()

    await browserContext.loginAs(staff)
    const page = await visit(
      route('staff.trip.show', { number: order.orderNumber, type: 'pickup' })
    )

    await page.locator('input[type="file"]').setInputFiles(photoPath)
    await page.getByRole('button', { name: 'Selesaikan Tugas' }).click()
    await page.getByRole('button', { name: 'Konfirmasi Selesai' }).click()

    await page.assertPath('/staff/trips')

    await order.refresh()
    assert.equal(order.status, 'in_inspection')
  })

  test('staff can cancel a task without completing it', async ({
    visit,
    route,
    browserContext,
  }) => {
    const staff = await UserFactory.apply('staff').create()
    const order = await OrderFactory.create()

    await browserContext.loginAs(staff)
    const page = await visit(
      route('staff.trip.show', { number: order.orderNumber, type: 'pickup' })
    )

    await page.getByRole('button', { name: 'Batalkan Tugas' }).first().click()
    await page.getByRole('button', { name: 'Batalkan Tugas' }).last().click()

    await page.assertPath('/staff/trips')
    await page.locator('[data-sonner-toast]').waitFor({ state: 'visible' })
    await page.assertTextContains('[data-sonner-toast]', 'Tugas dibatalkan.')
  })
})

test.group('Staff Queue Tabs', (group) => {
  group.each.setup(() => testUtils.db().truncate())

  test('each tab lists the work that belongs to it', async ({ visit, route, browserContext }) => {
    const staff = await UserFactory.apply('staff').merge({ phone: '081200000210' }).create()
    const { order: pickup } = await createPickupWithAddress('081200000211')
    const inspecting = await OrderFactory.apply('inInspection').create()
    const cleaning = await OrderFactory.apply('inCleaning').create()

    await browserContext.loginAs(staff)
    const page = await visit(route('staff.trip.index'))

    await page.assertTextContains('body', pickup.orderNumber)

    await page.getByRole('button', { name: /Inspeksi/ }).click()
    await page.assertTextContains('body', inspecting.orderNumber)

    await page.getByRole('button', { name: /Pencucian/ }).click()
    await page.assertTextContains('body', cleaning.orderNumber)
    await page.assertExists(page.getByRole('button', { name: 'Selesai Dicuci' }))
    await page.assertExists(page.getByRole('link', { name: 'Cetak Label' }))
  })

  test('an empty tab explains what is missing', async ({ visit, route, browserContext }) => {
    const staff = await UserFactory.apply('staff').merge({ phone: '081200000212' }).create()

    await browserContext.loginAs(staff)
    const page = await visit(route('staff.trip.index'))

    await page.assertTextContains('body', 'Tidak ada tugas')
    await page.assertTextContains('body', 'Belum ada penjemputan atau pengantaran')
  })

  test('a stop another staff member is holding is not listed', async ({
    visit,
    route,
    browserContext,
    assert,
  }) => {
    const holder = await UserFactory.apply('staff').merge({ phone: '081200000213' }).create()
    const other = await UserFactory.apply('staff').merge({ phone: '081200000214' }).create()
    const { order } = await createPickupWithAddress('081200000215')

    await browserContext.loginAs(holder)
    await visit(route('staff.trip.show', { number: order.orderNumber, type: 'pickup' }))

    await browserContext.loginAs(other)
    const page = await visit(route('staff.trip.index'))

    assert.notInclude(await page.locator('body').innerText(), order.orderNumber)
  })

  test('marking a batch washed moves it out of the cleaning tab', async ({
    visit,
    route,
    browserContext,
    assert,
  }) => {
    const staff = await UserFactory.apply('staff').merge({ phone: '081200000216' }).create()
    const customer = await UserFactory.merge({ phone: '081200000217' }).create()
    const address = await AddressFactory.merge({ userId: customer.id, isActive: true }).create()

    const order = await OrderFactory.apply('inCleaning')
      .merge({ userId: customer.id, addressId: address.id })
      .create()

    await browserContext.loginAs(staff)
    const page = await visit(route('staff.trip.index'))

    await page.getByRole('button', { name: /Pencucian/ }).click()
    await page.getByRole('button', { name: 'Selesai Dicuci' }).click()

    await page.locator('input[name="photo"]').setInputFiles(photoPath)
    await page.getByRole('button', { name: 'Konfirmasi Selesai' }).click()

    await page.locator('[data-sonner-toast]').waitFor({ state: 'visible' })
    await page.assertTextContains('[data-sonner-toast]', 'selesai')

    // It has an address, so it joins the delivery half of the trip queue.
    await order.refresh()
    assert.equal(order.status, 'in_delivery')
  })
})

test.group('Staff Cleaning Tab', (group) => {
  group.each.setup(() => testUtils.db().truncate())

  function createWashService() {
    return Service.create({
      name: 'Cuci Sepatu Reguler',
      description: 'Cuci sepatu standar',
      category: ServiceCategory.SHOE_WASH,
      type: ServiceType.REGULAR,
      price: 30000,
    })
  }

  /**
   * Puts priced lines on an order the way inspection and walk-in orders do, so
   * the card has an item count to show.
   */
  async function addItems(order: Order, service: Service, count: number) {
    for (let position = 1; position <= count; position++) {
      const item = await Item.create({
        type: ItemType.SHOE,
        brand: `Merek ${position}`,
        model: 'Model',
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
    }
  }

  /**
   * The card says what the washer needs — which batch, how many things are in
   * it, and where it came from — and stops there. The customer's name is not
   * something a queue on every phone on shift needs to carry.
   */
  test('each batch on the rack shows its item count and how it arrived', async ({
    visit,
    route,
    browserContext,
    assert,
  }) => {
    const staff = await UserFactory.apply('staff').merge({ phone: '081200000250' }).create()
    const service = await createWashService()

    const walkIn = await OrderFactory.apply('inCleaning')
      .apply('offline')
      .merge({ userId: null, addressId: null, customerName: 'Dewi' })
      .create()
    await addItems(walkIn, service, 2)

    const customer = await UserFactory.merge({ phone: '081200000251' }).create()
    const address = await AddressFactory.merge({ userId: customer.id, isActive: true }).create()
    const booked = await OrderFactory.apply('inCleaning')
      .merge({ userId: customer.id, addressId: address.id, customerName: 'Agus' })
      .create()
    await addItems(booked, service, 1)

    await browserContext.loginAs(staff)
    const page = await visit(route('staff.trip.index'))

    await page.getByRole('button', { name: /Pencucian/ }).click()

    const cleaningTab = await page.locator('body').innerText()
    assert.include(cleaningTab, walkIn.orderNumber)
    assert.include(cleaningTab, '2 item')
    assert.include(cleaningTab, 'Offline')

    assert.include(cleaningTab, booked.orderNumber)
    assert.include(cleaningTab, '1 item')
    assert.include(cleaningTab, 'Online')

    assert.notInclude(cleaningTab, 'Dewi')
    assert.notInclude(cleaningTab, 'Agus')
  })

  test('Cetak Label opens the printable tag for the batch', async ({
    visit,
    route,
    browserContext,
  }) => {
    const staff = await UserFactory.apply('staff').merge({ phone: '081200000252' }).create()
    const order = await OrderFactory.apply('inCleaning').create()

    await browserContext.loginAs(staff)
    const page = await visit(route('staff.trip.index'))

    await page.getByRole('button', { name: /Pencucian/ }).click()
    await page.getByRole('link', { name: 'Cetak Label' }).click()

    await page.assertPath(`/staff/orders/${order.orderNumber}/tag`)
    await page.assertTextContains('body', order.orderNumber)
  })

  test('marking a walk-in batch washed moves it to the collection tab', async ({
    visit,
    route,
    browserContext,
    assert,
  }) => {
    const staff = await UserFactory.apply('staff').merge({ phone: '081200000253' }).create()

    // Dropped off at the counter, so there is no address and nothing to deliver.
    const order = await OrderFactory.apply('inCleaning')
      .apply('offline')
      .merge({ userId: null, addressId: null })
      .create()

    await browserContext.loginAs(staff)
    const page = await visit(route('staff.trip.index'))

    await page.getByRole('button', { name: /Pencucian/ }).click()
    await page.getByRole('button', { name: 'Selesai Dicuci' }).click()

    await page.locator('input[name="photo"]').setInputFiles(photoPath)
    await page.getByRole('button', { name: 'Konfirmasi Selesai' }).click()

    await page.locator('[data-sonner-toast]').waitFor({ state: 'visible' })
    await page.assertTextContains('[data-sonner-toast]', `Pencucian ${order.orderNumber} selesai.`)

    await order.refresh()
    assert.equal(order.status, OrderStatus.CLEANING_DONE)

    await page.getByRole('button', { name: /Pencucian/ }).click()
    await page.assertTextContains('body', 'Belum ada barang yang sedang dicuci')
    assert.equal(await page.getByRole('button', { name: 'Selesai Dicuci' }).count(), 0)

    // Washed, paid for, and still in the shop — not finished until somebody
    // walks out with it.
    await page.getByRole('button', { name: /Siap Diambil/ }).click()
    await page.assertTextContains('body', order.orderNumber)
  })

  test('the confirm dialog can be dismissed without washing anything off the tab', async ({
    visit,
    route,
    browserContext,
    assert,
  }) => {
    const staff = await UserFactory.apply('staff').merge({ phone: '081200000254' }).create()
    const order = await OrderFactory.apply('inCleaning').create()

    await browserContext.loginAs(staff)
    const page = await visit(route('staff.trip.index'))

    await page.getByRole('button', { name: /Pencucian/ }).click()
    await page.getByRole('button', { name: 'Selesai Dicuci' }).click()

    // The dialog exists precisely so a mis-tap costs nothing.
    await page.assertTextContains('body', 'Selesai dicuci?')
    await page.getByRole('button', { name: 'Batal' }).click()

    await order.refresh()
    assert.equal(order.status, 'in_cleaning')
    await page.assertExists(page.getByRole('button', { name: 'Selesai Dicuci' }))
  })

  test('the dialog shows the inspection photo as the before shot', async ({
    visit,
    route,
    browserContext,
    assert,
  }) => {
    const staff = await UserFactory.apply('staff').merge({ phone: '081200000255' }).create()
    const order = await OrderFactory.apply('inCleaning').create()

    await OrderAction.create({
      orderId: order.id,
      staffId: staff.id,
      name: 'inspection',
      photoPath: 'https://example.test/inspection-photo.png',
      note: null,
    })

    await browserContext.loginAs(staff)
    const page = await visit(route('staff.trip.index'))

    await page.getByRole('button', { name: /Pencucian/ }).click()
    await page.getByRole('button', { name: 'Selesai Dicuci' }).click()

    const beforePhoto = page.getByAltText('Foto sebelum dicuci')
    await beforePhoto.waitFor({ state: 'attached' })
    assert.equal(await beforePhoto.getAttribute('src'), 'https://example.test/inspection-photo.png')
  })
})

test.group('Staff Trip Navigation', (group) => {
  group.each.setup(() => testUtils.db().truncate())

  test('a claimed stop shows the map and a Google Maps directions link', async ({
    visit,
    route,
    browserContext,
    assert,
  }) => {
    const staff = await UserFactory.apply('staff').merge({ phone: '081200000220' }).create()
    const { order, address } = await createPickupWithAddress('081200000221')

    await browserContext.loginAs(staff)
    const page = await visit(
      route('staff.trip.show', { number: order.orderNumber, type: 'pickup' })
    )

    await page.locator('[role="application"]').waitFor({ state: 'visible' })

    const directions = page.getByRole('link', { name: 'Buka di Google Maps' })
    assert.equal(
      await directions.getAttribute('href'),
      `https://www.google.com/maps/dir/?api=1&destination=${address.latitude},${address.longitude}`
    )
    assert.equal(await directions.getAttribute('target'), '_blank')

    await page.assertTextContains('body', address.name)
    await page.assertTextContains('body', address.street)
  })

  test('the recipient phone opens WhatsApp in international format', async ({
    visit,
    route,
    browserContext,
    assert,
  }) => {
    const staff = await UserFactory.apply('staff').merge({ phone: '081200000240' }).create()
    const customer = await UserFactory.merge({ phone: '081200000241' }).create()
    const address = await AddressFactory.merge({
      userId: customer.id,
      isActive: true,
      phone: '081387882973',
    }).create()

    const order = await OrderFactory.merge({
      userId: customer.id,
      addressId: address.id,
      pickupDate: DateTime.now(),
    }).create()

    await browserContext.loginAs(staff)
    const page = await visit(
      route('staff.trip.show', { number: order.orderNumber, type: 'pickup' })
    )

    const contact = page.getByRole('link', { name: '081387882973' })

    // Stored as 08…, but WhatsApp only accepts the 62 country code.
    assert.equal(await contact.getAttribute('href'), 'https://wa.me/6281387882973')
    assert.equal(await contact.getAttribute('target'), '_blank')
  })

  test('claiming a pickup marks the order as being collected', async ({
    visit,
    route,
    browserContext,
    assert,
  }) => {
    const staff = await UserFactory.apply('staff').merge({ phone: '081200000222' }).create()
    const { order } = await createPickupWithAddress('081200000223')

    await browserContext.loginAs(staff)
    await visit(route('staff.trip.show', { number: order.orderNumber, type: 'pickup' }))

    const action = await OrderAction.query().where('orderId', order.id).firstOrFail()
    assert.equal(action.name, 'attempt_pickup')
    assert.equal(action.staffId, staff.id)

    await order.refresh()
    assert.equal(order.status, 'in_pickup')
  })

  test('a claimed task offers no way out but finishing or cancelling', async ({
    visit,
    route,
    browserContext,
    assert,
  }) => {
    const staff = await UserFactory.apply('staff').merge({ phone: '081200000224' }).create()
    const { order } = await createPickupWithAddress('081200000225')

    await browserContext.loginAs(staff)
    const page = await visit(
      route('staff.trip.show', { number: order.orderNumber, type: 'pickup' })
    )

    // The header back-arrow only renders for a task somebody else holds.
    assert.equal(await page.locator('header a, a[href="/staff/trips"]').count(), 0)

    await page.assertExists(page.getByRole('button', { name: 'Selesaikan Tugas' }))
    await page.assertExists(page.getByRole('button', { name: 'Batalkan Tugas' }))
  })

  test('the queue sends a staff member back to the task they hold', async ({
    visit,
    route,
    browserContext,
  }) => {
    const staff = await UserFactory.apply('staff').merge({ phone: '081200000226' }).create()
    const { order } = await createPickupWithAddress('081200000227')

    await browserContext.loginAs(staff)
    await visit(route('staff.trip.show', { number: order.orderNumber, type: 'pickup' }))

    const page = await visit(route('staff.trip.index'))

    await page.assertPath(`/staff/trips/${order.orderNumber}/pickup`)
  })

  test('cancelling puts the stop back in the queue and clears the status', async ({
    visit,
    route,
    browserContext,
    assert,
  }) => {
    const staff = await UserFactory.apply('staff').merge({ phone: '081200000228' }).create()
    const { order } = await createPickupWithAddress('081200000229')

    await browserContext.loginAs(staff)
    const page = await visit(
      route('staff.trip.show', { number: order.orderNumber, type: 'pickup' })
    )

    await page.getByRole('button', { name: 'Batalkan Tugas' }).first().click()
    await page.getByRole('button', { name: 'Batalkan Tugas' }).last().click()

    await page.assertPath('/staff/trips')
    await page.assertTextContains('body', order.orderNumber)

    await order.refresh()
    assert.equal(order.status, 'pickup_scheduled')
  })

  test('completing a delivery finishes the order', async ({
    visit,
    route,
    browserContext,
    assert,
  }) => {
    const staff = await UserFactory.apply('staff').merge({ phone: '081200000230' }).create()
    const customer = await UserFactory.merge({ phone: '081200000231' }).create()
    const address = await AddressFactory.merge({ userId: customer.id, isActive: true }).create()

    const order = await OrderFactory.apply('inDelivery')
      .merge({ userId: customer.id, addressId: address.id })
      .create()

    await browserContext.loginAs(staff)
    const page = await visit(
      route('staff.trip.show', { number: order.orderNumber, type: 'delivery' })
    )

    await page.locator('input[type="file"]').setInputFiles(photoPath)
    await page.getByRole('button', { name: 'Selesaikan Tugas' }).click()
    await page.getByRole('button', { name: 'Konfirmasi Selesai' }).click()

    await page.assertPath('/staff/trips')

    await order.refresh()
    assert.equal(order.status, 'completed')
  })
})
