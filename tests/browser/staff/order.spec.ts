import { UserFactory } from '#database/factories/user_factory'
import Order from '#models/order'
import Transaction from '#models/transaction'
import Service from '#models/service'
import { ServiceCategory, ServiceType } from '#enums/service_enum'
import testUtils from '@adonisjs/core/services/test_utils'
import { test } from '@japa/runner'

function createMainService() {
  return Service.create({
    name: 'Cuci Sepatu Reguler',
    description: 'Cuci sepatu standar',
    category: ServiceCategory.SHOE_WASH,
    type: ServiceType.REGULAR,
    price: 30000,
  })
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
})
