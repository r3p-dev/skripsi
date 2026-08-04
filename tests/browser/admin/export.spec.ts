import { OrderFactory } from '#database/factories/order_factory'
import { UserFactory } from '#database/factories/user_factory'
import testUtils from '@adonisjs/core/services/test_utils'
import { test } from '@japa/runner'

test.group('Admin Export Button', (group) => {
  group.each.setup(() => testUtils.db().truncate())

  test('the export button downloads a spreadsheet', async ({
    visit,
    route,
    browserContext,
    assert,
  }) => {
    const admin = await UserFactory.apply('admin').merge({ phone: '081393000001' }).create()
    await OrderFactory.createMany(3)

    await browserContext.loginAs(admin)
    const page = await visit(route('admin.order.index'))

    const [download] = await Promise.all([
      page.waitForEvent('download'),
      page.getByRole('link', { name: 'Ekspor Excel' }).click(),
    ])

    assert.match(download.suggestedFilename(), /^umimaclean-pesanan-\d{8}-\d{4}\.xlsx$/)
  })

  /**
   * The button builds its link from the URL the browser is already on, so this
   * is the assertion that the file an admin gets is the list they are looking
   * at — and that `page` is dropped, because an export is the whole list.
   */
  test('the export link carries the filters on screen but not the page', async ({
    visit,
    route,
    browserContext,
    assert,
  }) => {
    const admin = await UserFactory.apply('admin').merge({ phone: '081393001001' }).create()
    await OrderFactory.apply('offline').createMany(2)

    await browserContext.loginAs(admin)
    const page = await visit(`${route('admin.order.index')}?type=offline&search=ORD&page=2`)

    const href = await page.getByRole('link', { name: 'Ekspor Excel' }).getAttribute('href')

    assert.include(href, '/admin/orders/export?')
    assert.include(href, 'type=offline')
    assert.include(href, 'search=ORD')
    assert.notInclude(href, 'page=')
  })

  test('every admin screen offers the export', async ({ visit, route, browserContext }) => {
    const admin = await UserFactory.apply('admin').merge({ phone: '081393002001' }).create()

    await browserContext.loginAs(admin)

    const screens = [
      'admin.dashboard.index',
      'admin.order.index',
      'admin.reconciliation.index',
      'admin.service.index',
      'admin.user.index',
      'admin.report.index',
    ] as const

    for (const screen of screens) {
      const page = await visit(route(screen))

      await page.assertExists(page.locator('a', { hasText: 'Ekspor Excel' }))
    }
  })
})
