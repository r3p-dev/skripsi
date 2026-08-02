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
    await page.getByRole('button', { name: 'Konfirmasi Selesai' }).click()

    // Completing an inspection hands staff the correction form for what they typed.
    await page.assertPath(`/staff/orders/${order.orderNumber}/items`)

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

test.group('Staff Inspection Proof Photo', (group) => {
  group.each.setup(() => testUtils.db().truncate())

  test('an inspection cannot be completed without a proof photo', async ({
    visit,
    route,
    browserContext,
    assert,
  }) => {
    const staff = await UserFactory.apply('staff').merge({ phone: '081200000310' }).create()
    const order = await OrderFactory.apply('inInspection').create()
    const service = await createMainService()

    await browserContext.loginAs(staff)
    const page = await visit(route('staff.inspection.show', { number: order.orderNumber }))

    await page.locator('input[name="items[0][brand]"]').fill('Nike')
    await page.locator('input[name="items[0][model]"]').fill('Air Max')
    await page.locator('input[name="items[0][material]"]').fill('Kanvas')
    await page.locator('input[name="items[0][size]"]').fill('42')
    await page.locator('input[name="items[0][condition]"]').fill('Kotor ringan')
    await page.locator('select[name="items[0][service]"]').selectOption(String(service.id))

    await page.getByRole('button', { name: 'Selesaikan Inspeksi' }).click()

    // The browser blocks the submit itself, so nothing is inspected and the
    // staff member is still holding the task.
    await page.assertPath(`/staff/inspections/${order.orderNumber}`)

    await order.refresh()
    assert.equal(order.status, 'in_inspection')
  })
})

test.group('Staff Inspection Item Form', (group) => {
  group.each.setup(() => testUtils.db().truncate())

  async function visitInspectionForm(visit: any, route: any, browserContext: any, phone: string) {
    const staff = await UserFactory.apply('staff').merge({ phone }).create()
    const order = await OrderFactory.apply('inInspection').create()

    await browserContext.loginAs(staff)

    return visit(route('staff.inspection.show', { number: order.orderNumber }))
  }

  test('a single item cannot be removed, since an inspection needs at least one', async ({
    visit,
    route,
    browserContext,
    assert,
  }) => {
    await createMainService()
    const page = await visitInspectionForm(visit, route, browserContext, '081200000301')

    await page.locator('input[name="items[0][brand]"]').waitFor({ state: 'attached' })
    assert.equal(await page.getByRole('button', { name: 'Hapus barang 1' }).count(), 0)

    await page.getByRole('button', { name: 'Tambah Barang' }).click()

    // With two items on the form, either one may go.
    await page.getByRole('button', { name: 'Hapus barang 2' }).waitFor({ state: 'attached' })
    assert.equal(await page.getByRole('button', { name: /^Hapus barang/ }).count(), 2)
  })

  test('removing a row closes the gap it leaves in the payload', async ({
    visit,
    route,
    browserContext,
    assert,
  }) => {
    await createMainService()
    const page = await visitInspectionForm(visit, route, browserContext, '081200000302')

    await page.getByRole('button', { name: 'Tambah Barang' }).click()
    await page.getByRole('button', { name: 'Tambah Barang' }).click()

    await page.locator('input[name="items[0][brand]"]').fill('Nike')
    await page.locator('input[name="items[1][brand]"]').fill('Adidas')
    await page.locator('input[name="items[2][brand]"]').fill('Puma')

    await page.getByRole('button', { name: 'Hapus barang 2' }).click()

    // The third row slides down into items[1] keeping its own values, so the
    // posted array has no hole in it.
    await page.locator('input[name="items[2][brand]"]').waitFor({ state: 'detached' })
    assert.equal(await page.locator('input[name="items[0][brand]"]').inputValue(), 'Nike')
    assert.equal(await page.locator('input[name="items[1][brand]"]').inputValue(), 'Puma')

    // The cards renumber too, so nothing claims to be the third item any more.
    assert.equal(await page.getByRole('button', { name: /^Hapus barang/ }).count(), 2)
    assert.equal(await page.getByRole('button', { name: 'Hapus barang 3' }).count(), 0)
  })

  test('the item type is derived from the category of the chosen service', async ({
    visit,
    route,
    browserContext,
    assert,
  }) => {
    const shoeService = await createMainService()
    const bagService = await Service.create({
      name: 'Cuci Tas Reguler',
      description: 'Cuci tas standar',
      category: ServiceCategory.BAG_WASH,
      type: ServiceType.REGULAR,
      price: 25000,
    })

    const page = await visitInspectionForm(visit, route, browserContext, '081200000303')

    const itemType = page.locator('input[name="items[0][type]"]')

    // Nothing chosen yet, so there is nothing to derive a type from.
    assert.equal(await itemType.inputValue(), '')

    await page.locator('select[name="items[0][service]"]').selectOption(String(shoeService.id))
    assert.equal(await itemType.inputValue(), 'shoe')

    // Switching the service switches the item type with it.
    await page.locator('select[name="items[0][service]"]').selectOption(String(bagService.id))
    assert.equal(await itemType.inputValue(), 'bag')
  })

  test('additional services are offered separately from the main service', async ({
    visit,
    route,
    browserContext,
    assert,
  }) => {
    const mainService = await createMainService()
    const additionalService = await Service.create({
      name: 'Deodorizer',
      description: 'Layanan tambahan anti bau',
      category: ServiceCategory.ADDITIONAL,
      type: ServiceType.ADDITIONAL,
      price: 10000,
    })

    const page = await visitInspectionForm(visit, route, browserContext, '081200000304')

    // An additional service is never a valid main service.
    const mainServiceOptions = page.locator('select[name="items[0][service]"] option')
    await mainServiceOptions.first().waitFor({ state: 'attached' })

    const mainOptions = await mainServiceOptions.all()
    const mainOptionValues = await Promise.all(
      mainOptions.map((option: any) => option.getAttribute('value'))
    )
    assert.includeMembers(mainOptionValues, [String(mainService.id)])
    assert.notInclude(mainOptionValues, String(additionalService.id))

    await page.assertExists(
      page.locator(`input[name="items[0][additionalServices][]"][value="${additionalService.id}"]`)
    )
  })
})
