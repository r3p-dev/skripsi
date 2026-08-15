import { test } from '@japa/runner'
import { geocodeValidator, nearbyValidator } from '#validators/geocode_validator'
import { AREA_CENTER } from '#database/factories/operational_area_factory'
import { invalidFields } from '#tests/utils/helpers'

test.group('geocodeValidator', () => {
  test('accepts a search term', async ({ assert }) => {
    const payload = await geocodeValidator.validate({ query: 'jalan cihampelas' })

    assert.equal(payload.query, 'jalan cihampelas')
  })

  test('trims the search term', async ({ assert }) => {
    const payload = await geocodeValidator.validate({ query: '  jalan cihampelas  ' })

    assert.equal(payload.query, 'jalan cihampelas')
  })

  test('accepts the shortest useful term', async ({ assert }) => {
    const payload = await geocodeValidator.validate({ query: 'abc' })

    assert.equal(payload.query, 'abc')
  })

  test('refuses a term shorter than three characters', async ({ assert }) => {
    assert.include(await invalidFields(() => geocodeValidator.validate({ query: 'ab' })), 'query')
  })

  test('refuses whitespace padded out to look long enough', async ({ assert }) => {
    assert.include(await invalidFields(() => geocodeValidator.validate({ query: ' a ' })), 'query')
  })

  test('refuses a term longer than 255 characters', async ({ assert }) => {
    const fields = await invalidFields(() => geocodeValidator.validate({ query: 'a'.repeat(256) }))

    assert.include(fields, 'query')
  })

  test('demands a search term', async ({ assert }) => {
    assert.include(await invalidFields(() => geocodeValidator.validate({})), 'query')
  })
})

test.group('nearbyValidator', () => {
  test('accepts a point on the globe', async ({ assert }) => {
    const payload = await nearbyValidator.validate(AREA_CENTER)

    assert.equal(payload.latitude, AREA_CENTER.latitude)
    assert.equal(payload.longitude, AREA_CENTER.longitude)
  })

  test('reads coordinates sent as text, as a query string does', async ({ assert }) => {
    const payload = await nearbyValidator.validate({
      latitude: '-6.9555305',
      longitude: '107.6540353',
    })

    assert.equal(payload.latitude, -6.9555305)
    assert.equal(payload.longitude, 107.6540353)
  })

  test('refuses coordinates off the globe', async ({ assert }) => {
    const fields = await invalidFields(() =>
      nearbyValidator.validate({ latitude: 120, longitude: 400 })
    )

    assert.includeMembers(fields, ['latitude', 'longitude'])
  })

  test('demands both coordinates', async ({ assert }) => {
    const fields = await invalidFields(() => nearbyValidator.validate({}))

    assert.includeMembers(fields, ['latitude', 'longitude'])
  })
})
