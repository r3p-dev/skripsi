import { test } from '@japa/runner'
import type { Page } from 'playwright'
import Order from '#models/order'
import testUtils from '@adonisjs/core/services/test_utils'
import { OrderStatus } from '#enums/order_enum'
import { createCustomer, createOrder } from '#tests/utils/helpers'
import { DateTime } from 'luxon'

async function pickDate(page: Page, date: DateTime): Promise<void> {
  const day = page.locator(`button[data-day="${date.toFormat('d/M/yyyy')}"]`)

  if ((await day.count()) === 0) {
    await page.getByRole('button', { name: 'Go to the Next Month' }).click()
  }

  await day.click()
}

test.group('Customer orders in the browser | booking a pickup', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  test('a customer books a pickup from start to finish', async ({
    visit,
    browserContext,
    assert,
  }) => {
    const customer = await createCustomer()

    await browserContext.loginAs(customer.user)

    const page = await visit('/orders/create')

    await page.getByRole('button', { name: 'Tambah jumlah Sepatu' }).click()

    await page.locator('#shoe-0-brand').fill('Nike')
    await page.locator('#shoe-0-model').fill('Air Force 1')
    await page.locator('#shoe-0-material').fill('Kanvas')
    await page.locator('#shoe-0-size').fill('42')

    await pickDate(page, DateTime.now().plus({ days: 1 }))

    await page.locator('button:visible', { hasText: 'Konfirmasi Pesanan' }).first().click()

    await page.waitForURL('**/orders/ORD*')

    const order = await Order.query().where('user_id', customer.user.id).firstOrFail()

    assert.equal(order.status, OrderStatus.PICKUP_SCHEDULED)
    assert.equal(order.addressId, customer.address.id)

    await page.assertPath(`/orders/${order.orderNumber}`)
    await page.assertExists(page.getByText(order.orderNumber).first())

    const items = await order.related('items').query()

    assert.lengthOf(items, 1)
    assert.equal(items[0].brand, 'Nike')
  })

  test('the form refuses to submit with no goods and no date', async ({
    visit,
    browserContext,
    assert,
  }) => {
    const customer = await createCustomer()

    await browserContext.loginAs(customer.user)

    const page = await visit('/orders/create')

    await assert.isTrue(
      await page.locator('button:visible', { hasText: 'Konfirmasi Pesanan' }).first().isDisabled()
    )
  })

  test('a customer with no address is asked for one first', async ({ visit, browserContext }) => {
    const customer = await createCustomer()

    await customer.address.delete()
    await browserContext.loginAs(customer.user)

    const page = await visit('/orders/create')

    await page.assertExists(page.getByText('Tambahkan alamat penjemputan terlebih dahulu'))
  })
})

test.group('Customer orders in the browser | calling off a pickup', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  test('a customer cancels an order that has not been collected', async ({
    visit,
    browserContext,
    assert,
  }) => {
    const customer = await createCustomer()
    const order = await createOrder(customer)

    await browserContext.loginAs(customer.user)

    const page = await visit(`/orders/${order.orderNumber}`)

    await page.getByRole('button', { name: 'Batalkan Pesanan' }).first().click()
    await page.getByText('Batalkan pesanan ini?').waitFor()

    // The dialog repeats the trigger's wording on its submit button.
    await page.locator('form button[type="submit"]', { hasText: 'Batalkan Pesanan' }).click()

    await page.getByText('Batalkan pesanan ini?').waitFor({ state: 'hidden' })

    await order.refresh()
    assert.equal(order.status, OrderStatus.CANCELLED)
  })

  test('an order already on the van offers no way to cancel', async ({
    visit,
    browserContext,
    assert,
  }) => {
    const customer = await createCustomer()
    const order = await createOrder(customer, { states: ['collected'] })

    await browserContext.loginAs(customer.user)

    const page = await visit(`/orders/${order.orderNumber}`)

    await page.getByText(order.orderNumber).first().waitFor()

    assert.equal(await page.getByRole('button', { name: 'Batalkan Pesanan' }).count(), 0)
  })

  test('the order list shows the orders a customer has placed', async ({
    visit,
    browserContext,
  }) => {
    const customer = await createCustomer()
    const order = await createOrder(customer)

    await browserContext.loginAs(customer.user)

    const page = await visit('/orders')

    await page.assertExists(page.getByText(order.orderNumber).first())
  })
})
