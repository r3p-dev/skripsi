import { UserFactory } from '#database/factories/user_factory'
import { OrderFactory } from '#database/factories/order_factory'
import testUtils from '@adonisjs/core/services/test_utils'
import { test } from '@japa/runner'
import { fileURLToPath } from 'node:url'
import { DateTime } from 'luxon'

const photoPath = fileURLToPath(new URL('../../fixtures/photo.png', import.meta.url))

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

    await page.getByText(order.orderNumber).click()

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

    await page.getByRole('button', { name: 'Batalkan Tugas' }).click()

    await page.assertPath('/staff/trips')
    await page.locator('[data-sonner-toast]').waitFor({ state: 'visible' })
    await page.assertTextContains('[data-sonner-toast]', 'Tugas dibatalkan.')
  })
})
