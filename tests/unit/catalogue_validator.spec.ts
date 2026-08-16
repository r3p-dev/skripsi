import { test } from '@japa/runner'
import { CatalogueCategory, CatalogueType } from '#enums/catalogue_enum'
import { catalogueValidator } from '#validators/catalogue_validator'
import { invalidFields } from '#tests/utils/helpers'

function cataloguePayload(overrides: Record<string, unknown> = {}) {
  return {
    catalogueName: 'Cuci Kilat',
    description: 'Selesai dalam satu hari kerja',
    price: 75_000,
    category: CatalogueCategory.SHOE_WASH,
    type: CatalogueType.REGULAR,
    ...overrides,
  }
}

test.group('catalogueValidator', () => {
  test('accepts a complete price list entry', async ({ assert }) => {
    const payload = await catalogueValidator.validate(cataloguePayload())

    assert.equal(payload.catalogueName, 'Cuci Kilat')
    assert.equal(payload.price, 75_000)
    assert.equal(payload.category, CatalogueCategory.SHOE_WASH)
  })

  test('reads a price typed into a form as text', async ({ assert }) => {
    const payload = await catalogueValidator.validate(cataloguePayload({ price: '75000' }))

    assert.strictEqual(payload.price, 75_000)
  })

  test('demands every field', async ({ assert }) => {
    const fields = await invalidFields(() => catalogueValidator.validate({}))

    assert.includeMembers(fields, ['catalogueName', 'description', 'price', 'category', 'type'])
  })

  test('accepts every category the laundry offers', async ({ assert }) => {
    for (const category of Object.values(CatalogueCategory)) {
      const payload = await catalogueValidator.validate(cataloguePayload({ category }))

      assert.equal(payload.category, category)
    }
  })

  test('accepts every kind of pricing', async ({ assert }) => {
    for (const type of Object.values(CatalogueType)) {
      const payload = await catalogueValidator.validate(cataloguePayload({ type }))

      assert.equal(payload.type, type)
    }
  })

  test('refuses a category that is not offered', async ({ assert }) => {
    const fields = await invalidFields(() =>
      catalogueValidator.validate(cataloguePayload({ category: 'cuci_mobil' }))
    )

    assert.include(fields, 'category')
  })

  test('refuses a kind of pricing that does not exist', async ({ assert }) => {
    const fields = await invalidFields(() =>
      catalogueValidator.validate(cataloguePayload({ type: 'gratis' }))
    )

    assert.include(fields, 'type')
  })

  test('refuses a free or negative price', async ({ assert }) => {
    assert.include(
      await invalidFields(() => catalogueValidator.validate(cataloguePayload({ price: 0 }))),
      'price'
    )
    assert.include(
      await invalidFields(() => catalogueValidator.validate(cataloguePayload({ price: -1000 }))),
      'price'
    )
  })

  test('refuses a price beyond a hundred million', async ({ assert }) => {
    const fields = await invalidFields(() =>
      catalogueValidator.validate(cataloguePayload({ price: 100_000_001 }))
    )

    assert.include(fields, 'price')
  })

  test('accepts a price of exactly a hundred million', async ({ assert }) => {
    const payload = await catalogueValidator.validate(cataloguePayload({ price: 100_000_000 }))

    assert.equal(payload.price, 100_000_000)
  })

  test('refuses a catalogue name shorter than three characters', async ({ assert }) => {
    const fields = await invalidFields(() =>
      catalogueValidator.validate(cataloguePayload({ catalogueName: 'ab' }))
    )

    assert.include(fields, 'catalogueName')
  })

  test('refuses a catalogue name longer than a hundred characters', async ({ assert }) => {
    const fields = await invalidFields(() =>
      catalogueValidator.validate(cataloguePayload({ catalogueName: 'a'.repeat(101) }))
    )

    assert.include(fields, 'catalogueName')
  })

  test('refuses a description longer than 255 characters', async ({ assert }) => {
    const fields = await invalidFields(() =>
      catalogueValidator.validate(cataloguePayload({ description: 'a'.repeat(256) }))
    )

    assert.include(fields, 'description')
  })

  test('trims the name and description', async ({ assert }) => {
    const payload = await catalogueValidator.validate(
      cataloguePayload({ catalogueName: '  Cuci Kilat  ', description: '  Selesai sehari  ' })
    )

    assert.equal(payload.catalogueName, 'Cuci Kilat')
    assert.equal(payload.description, 'Selesai sehari')
  })
})
