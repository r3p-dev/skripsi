import { serviceValidator } from '#validators/service_validator'
import { test } from '@japa/runner'

const validService = {
  name: 'Deep Clean Sepatu',
  description: 'Pembersihan menyeluruh bagian luar dan dalam.',
  price: 35000,
  category: 'shoe_wash',
  type: 'regular',
}

test.group('serviceValidator', () => {
  test('accepts a complete catalogue entry', async ({ assert }) => {
    const result = await serviceValidator.validate(validService)

    assert.equal(result.name, 'Deep Clean Sepatu')
    assert.equal(result.price, 35000)
  })

  /**
   * The shared `name()` rule is alpha-only, which is right for people and
   * wrong for a catalogue: real services carry digits and punctuation.
   */
  test('accepts a name with digits and punctuation', async ({ assert }) => {
    const result = await serviceValidator.validate({
      ...validService,
      name: 'Repaint Sepatu - 2 Warna',
    })

    assert.equal(result.name, 'Repaint Sepatu - 2 Warna')
  })

  test('rejects a name shorter than three characters', async ({ assert }) => {
    await assert.rejects(() => serviceValidator.validate({ ...validService, name: 'ab' }))
  })

  test('rejects a free service', async ({ assert }) => {
    await assert.rejects(() => serviceValidator.validate({ ...validService, price: 0 }))
  })

  test('rejects a negative price', async ({ assert }) => {
    await assert.rejects(() => serviceValidator.validate({ ...validService, price: -1000 }))
  })

  test('rejects a category that is not in the enum', async ({ assert }) => {
    await assert.rejects(() =>
      serviceValidator.validate({ ...validService, category: 'car_wash' })
    )
  })

  test('rejects a price type that is not in the enum', async ({ assert }) => {
    await assert.rejects(() =>
      serviceValidator.validate({ ...validService, type: 'negotiable' })
    )
  })

  test('accepts every category and price type the enums define', async ({ assert }) => {
    for (const category of ['shoe_wash', 'bag_wash', 'helmet_wash', 'shoe_repair', 'additional']) {
      const result = await serviceValidator.validate({ ...validService, category })
      assert.equal(result.category, category)
    }

    for (const type of ['regular', 'start_from', 'additional']) {
      const result = await serviceValidator.validate({ ...validService, type })
      assert.equal(result.type, type)
    }
  })
})
