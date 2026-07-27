import { UserFactory } from '#database/factories/user_factory'
import { OrderFactory } from '#database/factories/order_factory'
import Service from '#models/service'
import { ServiceCategory, ServiceType } from '#enums/service_enum'
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

test.group('Staff Inspection', (group) => {
  group.each.setup(() => testUtils.db().truncate())

  test('staff can fill in item and service details, then complete the inspection', async ({
    visit,
    route,
    browserContext,
    assert,
  }) => {
    const staff = await UserFactory.apply('staff').create()
    const order = await OrderFactory.apply('inInspection').create()
    const service = await createMainService()

    await browserContext.loginAs(staff)
    const page = await visit(route('staff.inspection.show', { number: order.orderNumber }))

    await page.assertTextContains('body', 'Inspeksi')

    await page.locator('input[name="items[0][brand]"]').fill('Nike')
    await page.locator('input[name="items[0][model]"]').fill('Air Max')
    await page.locator('input[name="items[0][material]"]').fill('Kanvas')
    await page.locator('input[name="items[0][size]"]').fill('42')
    await page.locator('input[name="items[0][condition]"]').fill('Kotor ringan')
    await page.locator('select[name="items[0][service]"]').selectOption(String(service.id))
    await page.locator('input[type="file"]').setInputFiles(photoPath)

    await page.getByRole('button', { name: 'Selesaikan Inspeksi' }).click()

    await page.assertPath('/staff/trips')

    await order.refresh()
    assert.equal(order.status, 'awaiting_payment')
    assert.equal(Number(order.totalPrice), 30000)
  })

  test('staff can add a second item before submitting', async ({
    visit,
    route,
    browserContext,
  }) => {
    const staff = await UserFactory.apply('staff').create()
    const order = await OrderFactory.apply('inInspection').create()
    await createMainService()

    await browserContext.loginAs(staff)
    const page = await visit(route('staff.inspection.show', { number: order.orderNumber }))

    await page.locator('input[name="items[0][brand]"]').waitFor({ state: 'attached' })
    await page.locator('input[name="items[1][brand]"]').waitFor({ state: 'detached' })

    await page.getByRole('button', { name: 'Tambah Barang' }).click()

    await page.locator('input[name="items[1][brand]"]').waitFor({ state: 'attached' })
  })
})
