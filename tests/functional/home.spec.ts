import { test } from '@japa/runner'
import testUtils from '@adonisjs/core/services/test_utils'
import { CatalogueFactory } from '#database/factories/catalogue_factory'
import { UserFactory } from '#database/factories/user_factory'

test.group('Home | the front page', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  test('a guest sees the price list', async ({ client, assert }) => {
    const catalogue = await CatalogueFactory.merge({ price: '55000' }).create()

    const response = await client.get('/').withInertia()

    response.assertStatus(200)
    response.assertInertiaComponent('home')

    const ids = (response.inertiaProps.catalogues as { id: number }[]).map((entry) => entry.id)

    assert.include(ids, catalogue.id)
  })

  test('the price list is ordered cheapest first', async ({ client, assert }) => {
    await CatalogueFactory.merge({ price: '90000' }).create()
    await CatalogueFactory.merge({ price: '15000' }).create()

    const response = await client.get('/').withInertia()

    const prices = (response.inertiaProps.catalogues as { price: number }[]).map((entry) =>
      Number(entry.price)
    )

    assert.deepEqual(
      prices,
      [...prices].sort((a, b) => a - b)
    )
  })

  test('a signed-in customer is sent to their own pages instead', async ({ client }) => {
    const user = await UserFactory.create()

    const response = await client.get('/').loginAs(user).redirects(0)

    response.assertStatus(302)
    response.assertHeader('location', '/profile')
  })
})

test.group('Home | the crawler files', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  test('robots.txt keeps crawlers out of the private areas', async ({ client, assert }) => {
    const response = await client.get('/robots.txt')

    response.assertStatus(200)
    assert.include(response.text(), 'Disallow: /admin')
    assert.include(response.text(), 'Disallow: /staff')
    assert.include(response.text(), 'Sitemap:')
  })

  test('the sitemap lists the front page', async ({ client, assert }) => {
    const response = await client.get('/sitemap.xml')

    response.assertStatus(200)
    assert.include(response.text(), '<urlset')
  })
})
