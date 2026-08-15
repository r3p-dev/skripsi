import { test } from '@japa/runner'
import { addressValidator } from '#validators/address_validator'
import { AREA_CENTER } from '#database/factories/operational_area_factory'
import { invalidFields } from '#tests/utils/helpers'

function addressPayload(overrides: Record<string, unknown> = {}) {
  return {
    name: 'Penerima Uji',
    phone: '081200009101',
    street: 'Jalan Uji Coba No. 1',
    latitude: AREA_CENTER.latitude,
    longitude: AREA_CENTER.longitude,
    ...overrides,
  }
}

test.group('addressValidator', () => {
  test('accepts a complete address', async ({ assert }) => {
    const payload = await addressValidator.validate(addressPayload())

    assert.equal(payload.street, 'Jalan Uji Coba No. 1')
    assert.equal(payload.latitude, AREA_CENTER.latitude)
    assert.equal(payload.longitude, AREA_CENTER.longitude)
  })

  test('reads coordinates sent as text', async ({ assert }) => {
    const payload = await addressValidator.validate(
      addressPayload({ latitude: String(AREA_CENTER.latitude), longitude: '107.6540353' })
    )

    assert.isNumber(payload.latitude)
    assert.equal(payload.longitude, 107.6540353)
  })

  test('demands every field but the note', async ({ assert }) => {
    const fields = await invalidFields(() => addressValidator.validate({}))

    assert.includeMembers(fields, ['name', 'phone', 'street', 'latitude', 'longitude'])
    assert.notInclude(fields, 'note')
  })

  test('the note is optional', async ({ assert }) => {
    const payload = await addressValidator.validate(addressPayload())

    assert.isUndefined(payload.note)
  })

  test('trims a note that is given', async ({ assert }) => {
    const payload = await addressValidator.validate(
      addressPayload({ note: '  Pagar hijau, rumah kedua  ' })
    )

    assert.equal(payload.note, 'Pagar hijau, rumah kedua')
  })

  test('refuses a latitude off the globe', async ({ assert }) => {
    assert.include(
      await invalidFields(() => addressValidator.validate(addressPayload({ latitude: 91 }))),
      'latitude'
    )
    assert.include(
      await invalidFields(() => addressValidator.validate(addressPayload({ latitude: -91 }))),
      'latitude'
    )
  })

  test('refuses a longitude off the globe', async ({ assert }) => {
    assert.include(
      await invalidFields(() => addressValidator.validate(addressPayload({ longitude: 181 }))),
      'longitude'
    )
    assert.include(
      await invalidFields(() => addressValidator.validate(addressPayload({ longitude: -181 }))),
      'longitude'
    )
  })

  test('accepts the poles and the antimeridian', async ({ assert }) => {
    const payload = await addressValidator.validate(
      addressPayload({ latitude: -90, longitude: 180 })
    )

    assert.equal(payload.latitude, -90)
    assert.equal(payload.longitude, 180)
  })

  test('refuses coordinates that are not numbers', async ({ assert }) => {
    const fields = await invalidFields(() =>
      addressValidator.validate(addressPayload({ latitude: 'utara', longitude: 'barat' }))
    )

    assert.includeMembers(fields, ['latitude', 'longitude'])
  })

  test('refuses a street longer than 255 characters', async ({ assert }) => {
    const fields = await invalidFields(() =>
      addressValidator.validate(addressPayload({ street: 'a'.repeat(256) }))
    )

    assert.include(fields, 'street')
  })

  test('trims the street', async ({ assert }) => {
    const payload = await addressValidator.validate(
      addressPayload({ street: '  Jalan Uji Coba No. 1  ' })
    )

    assert.equal(payload.street, 'Jalan Uji Coba No. 1')
  })

  test('refuses a recipient name with digits in it', async ({ assert }) => {
    const fields = await invalidFields(() =>
      addressValidator.validate(addressPayload({ name: 'Penerima 2' }))
    )

    assert.include(fields, 'name')
  })

  test('refuses a phone number that is not Indonesian', async ({ assert }) => {
    const fields = await invalidFields(() =>
      addressValidator.validate(addressPayload({ phone: '12345' }))
    )

    assert.include(fields, 'phone')
  })
})
