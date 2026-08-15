import { test } from '@japa/runner'
import GeocodingService from '#services/geocoding_service'
import NearbyService from '#services/nearby_service'
import app from '@adonisjs/core/services/app'
import testUtils from '@adonisjs/core/services/test_utils'
import {
  BrokenGeocodingService,
  BrokenNearbyService,
  FakeGeocodingService,
  FakeNearbyService,
} from '#tests/utils/fakes'
import { UserFactory } from '#database/factories/user_factory'
import {
  AREA_CENTER,
  OUTSIDE_AREA,
  createOperationalArea,
} from '#database/factories/operational_area_factory'
import { inputErrors } from '#tests/utils/helpers'

test.group('Customer geocode | searching for an address', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())
  group.each.teardown(() => app.container.restoreAll())

  test('returns the matches that fall inside the service area', async ({ client, assert }) => {
    await createOperationalArea()

    app.container.swap(
      GeocodingService,
      () => new FakeGeocodingService([{ ...AREA_CENTER, label: 'Jalan Dalam Jangkauan' }])
    )

    const user = await UserFactory.create()

    const response = await client.get('/address/geocode').qs({ query: 'jalan dalam' }).loginAs(user)

    response.assertStatus(200)

    const body = response.body()

    assert.isNull(body.reason)
    assert.lengthOf(body.results, 1)
    assert.equal(body.results[0].label, 'Jalan Dalam Jangkauan')
  })

  test('says so when nothing was found at all', async ({ client, assert }) => {
    await createOperationalArea()

    app.container.swap(GeocodingService, () => new FakeGeocodingService([]))

    const user = await UserFactory.create()

    const response = await client
      .get('/address/geocode')
      .qs({ query: 'tempat yang tidak ada' })
      .loginAs(user)

    response.assertStatus(200)
    assert.equal(response.body().reason, 'not_found')
    assert.isEmpty(response.body().results)
  })

  test('says so when every match sits outside the service area', async ({ client, assert }) => {
    await createOperationalArea()

    app.container.swap(
      GeocodingService,
      () => new FakeGeocodingService([{ ...OUTSIDE_AREA, label: 'Jalan Luar Jangkauan' }])
    )

    const user = await UserFactory.create()

    const response = await client.get('/address/geocode').qs({ query: 'jalan luar' }).loginAs(user)

    response.assertStatus(200)
    assert.equal(response.body().reason, 'outside_area')
    assert.isEmpty(response.body().results)
  })

  test('reports the lookup service being down as a 503', async ({ client, assert }) => {
    app.container.swap(GeocodingService, () => new BrokenGeocodingService())

    const user = await UserFactory.create()

    const response = await client
      .get('/address/geocode')
      .qs({ query: 'jalan apa saja' })
      .loginAs(user)

    response.assertStatus(503)
    assert.equal(response.body().reason, 'unavailable')
  })

  test('refuses a search term that is too short to be useful', async ({ client }) => {
    const user = await UserFactory.create()

    const response = await client
      .get('/address/geocode')
      .qs({ query: 'ab' })
      .accept('json')
      .loginAs(user)

    response.assertStatus(422)
  })

  /**
   * Without an `Accept: application/json` header the shared exception handler
   * treats the failure as a form post and redirects, even though the endpoint
   * only ever answers in JSON. The browser code must ask for JSON to see the
   * error.
   */
  test('a search term rejected without asking for JSON comes back as a redirect', async ({
    client,
    assert,
  }) => {
    const user = await UserFactory.create()

    const response = await client
      .get('/address/geocode')
      .qs({ query: 'ab' })
      .loginAs(user)
      .redirects(0)

    response.assertStatus(302)
    assert.property(inputErrors(response), 'query')
  })

  test('a guest cannot search', async ({ client, assert }) => {
    const response = await client
      .get('/address/geocode')
      .qs({ query: 'jalan apa saja' })
      .redirects(0)

    response.assertStatus(302)
    assert.match(response.headers().location as string, /^\/login/)
  })
})

test.group('Customer geocode | landmarks nearby', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())
  group.each.teardown(() => app.container.restoreAll())

  test('returns the places found around a point', async ({ client, assert }) => {
    app.container.swap(
      NearbyService,
      () =>
        new FakeNearbyService([
          { ...AREA_CENTER, label: 'Masjid Al-Uji', category: 'Tempat Ibadah', distance: 120 },
        ])
    )

    const user = await UserFactory.create()

    const response = await client
      .get('/address/nearby')
      .qs({ latitude: AREA_CENTER.latitude, longitude: AREA_CENTER.longitude })
      .loginAs(user)

    response.assertStatus(200)
    assert.lengthOf(response.body().places, 1)
    assert.equal(response.body().places[0].label, 'Masjid Al-Uji')
  })

  test('an empty neighbourhood is not an error', async ({ client, assert }) => {
    app.container.swap(NearbyService, () => new FakeNearbyService([]))

    const user = await UserFactory.create()

    const response = await client
      .get('/address/nearby')
      .qs({ latitude: AREA_CENTER.latitude, longitude: AREA_CENTER.longitude })
      .loginAs(user)

    response.assertStatus(200)
    assert.isEmpty(response.body().places)
  })

  test('reports the landmark service being down as a 503', async ({ client, assert }) => {
    app.container.swap(NearbyService, () => new BrokenNearbyService())

    const user = await UserFactory.create()

    const response = await client
      .get('/address/nearby')
      .qs({ latitude: AREA_CENTER.latitude, longitude: AREA_CENTER.longitude })
      .loginAs(user)

    response.assertStatus(503)
    assert.isEmpty(response.body().places)
  })

  test('refuses coordinates that are not on the globe', async ({ client }) => {
    const user = await UserFactory.create()

    const response = await client
      .get('/address/nearby')
      .qs({ latitude: 120, longitude: 400 })
      .accept('json')
      .loginAs(user)

    response.assertStatus(422)
  })
})
