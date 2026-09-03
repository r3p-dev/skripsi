import { test } from '@japa/runner'
import type { Page } from 'playwright'
import AddressService from '#services/address_service'
import OrderService, { ADMIN_ORDERS_CHANNEL } from '#services/order_service'
import testUtils from '@adonisjs/core/services/test_utils'
import transmit from '@adonisjs/transmit/services/main'
import { OrderStatus } from '#enums/order_enum'
import { UserFactory } from '#database/factories/user_factory'
import { createCustomer, createOrder } from '#tests/utils/helpers'

const orderService = new OrderService(new AddressService())

const SUBSCRIBED = 204
const REJECTED = 400

async function waitForSubscriber(channel: string): Promise<void> {
  for (let attempt = 0; attempt < 100; attempt++) {
    if (transmit.getSubscribersFor(channel).length > 0) {
      return
    }

    await new Promise((resolve) => setTimeout(resolve, 100))
  }

  throw new Error(`Nothing subscribed to ${channel} within the timeout.`)
}

/**
 * Performs the handshake a real browser performs: open the event stream so the
 * uid is registered, then subscribe carrying the XSRF token. Anything less is
 * turned away by CSRF long before the channel rule is consulted, which is easy
 * to misread as the rule having allowed it.
 */
async function subscribeTo(page: Page, channels: string[]): Promise<number[]> {
  return page.evaluate(async (list: string[]) => {
    const uid = crypto.randomUUID()

    const stream = await fetch(`/__transmit/events?uid=${uid}`, {
      headers: { accept: 'text/event-stream' },
    })

    const reader = stream.body!.getReader()

    await reader.read()

    const { cookie } = (globalThis as unknown as { document: { cookie: string } }).document

    const token = cookie
      .split('; ')
      .find((entry: string) => entry.startsWith('XSRF-TOKEN='))!
      .split('=')[1]

    const statuses: number[] = []

    for (const channel of list) {
      const response = await fetch('/__transmit/subscribe', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-xsrf-token': decodeURIComponent(token),
        },
        body: JSON.stringify({ uid, channel }),
      })

      statuses.push(response.status)
    }

    await reader.cancel()

    return statuses
  }, channels)
}

test.group('Admin dashboard in the browser | the live feed', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  test('an order change reaches the panel without a reload', async ({
    visit,
    browserContext,
    assert,
  }) => {
    const admin = await UserFactory.apply('admin').create()
    const customer = await createCustomer()
    const order = await createOrder(customer)

    await browserContext.loginAs(admin)

    const page = await visit('/admin')

    await page.getByText('Belum ada aktivitas sejak halaman dibuka').waitFor()

    /**
     * Survives in-place React updates but not a navigation, so the assertion at
     * the end can tell the two apart.
     */
    await page.evaluate(() => {
      ;(globalThis as unknown as { __alive: boolean }).__alive = true
    })

    await waitForSubscriber(ADMIN_ORDERS_CHANNEL)

    await orderService.transitionTo(order, OrderStatus.IN_PICKUP)

    /**
     * The order number alone is not proof: the recent-orders table on the same
     * page already prints it. Only the feed pairs it with an event label.
     */
    const entry = page.locator('li').filter({ hasText: order.orderNumber })

    await entry.getByText('Status Diperbarui').waitFor()
    await entry.getByText('Dalam Penjemputan').waitFor()

    assert.equal(await entry.count(), 1)
    assert.equal(await page.getByText('Belum ada aktivitas sejak halaman dibuka').count(), 0)
    assert.isTrue(
      await page.evaluate(() => (globalThis as unknown as { __alive?: boolean }).__alive)
    )
  })
})

test.group('Transmit channels | who may listen', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  test('a customer reaches their own order and nothing else', async ({
    visit,
    browserContext,
    assert,
  }) => {
    const customer = await createCustomer()
    const stranger = await createCustomer()

    const own = await createOrder(customer)
    const someoneElses = await createOrder(stranger)

    await browserContext.loginAs(customer.user)

    const page = await visit('/orders')

    const [shopWide, ownOrder, otherOrder] = await subscribeTo(page, [
      ADMIN_ORDERS_CHANNEL,
      `orders/${own.orderNumber}`,
      `orders/${someoneElses.orderNumber}`,
    ])

    assert.equal(shopWide, REJECTED)
    assert.equal(ownOrder, SUBSCRIBED)
    assert.equal(otherOrder, REJECTED)
  })

  test('staff reach any order but not the shop-wide feed', async ({
    visit,
    browserContext,
    assert,
  }) => {
    const customer = await createCustomer()
    const order = await createOrder(customer)

    await browserContext.loginAs(await UserFactory.apply('staff').create())

    const page = await visit('/staff/profile')

    const [shopWide, anyOrder] = await subscribeTo(page, [
      ADMIN_ORDERS_CHANNEL,
      `orders/${order.orderNumber}`,
    ])

    assert.equal(shopWide, REJECTED)
    assert.equal(anyOrder, SUBSCRIBED)
  })

  test('an admin reaches both', async ({ visit, browserContext, assert }) => {
    const customer = await createCustomer()
    const order = await createOrder(customer)

    await browserContext.loginAs(await UserFactory.apply('admin').create())

    const page = await visit('/admin/profile')

    const [shopWide, anyOrder] = await subscribeTo(page, [
      ADMIN_ORDERS_CHANNEL,
      `orders/${order.orderNumber}`,
    ])

    assert.equal(shopWide, SUBSCRIBED)
    assert.equal(anyOrder, SUBSCRIBED)
  })
})
