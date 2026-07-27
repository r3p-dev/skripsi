import { item } from '#validators/shared'
import { offlineOrderValidator } from '#validators/order_validator'
import { test } from '@japa/runner'
import vine from '@vinejs/vine'

const validItem = {
  brand: 'Nike',
  model: 'Air Max',
  type: 'shoe',
  size: '42',
  material: 'Kanvas',
  condition: 'Kotor ringan',
  service: 1,
}

test.group('item validator', () => {
  test('accepts a valid item', async ({ assert }) => {
    const result = await vine.validate({ schema: item, data: validItem })

    assert.equal(result.brand, 'Nike')
    assert.equal(result.type, 'shoe')
  })

  test('does not persist a category field, even if submitted', async ({ assert }) => {
    const result = await vine.validate({
      schema: item,
      data: { ...validItem, category: 'shoe_wash' },
    })

    assert.notProperty(result, 'category')
  })

  test('accepts additional services as an array of ids', async ({ assert }) => {
    const result = await vine.validate({
      schema: item,
      data: { ...validItem, additionalServices: [2, 3] },
    })

    assert.deepEqual(result.additionalServices, [2, 3])
  })

  test('rejects an item without a main service', async ({ assert }) => {
    const { service, ...withoutService } = validItem

    await assert.rejects(() => vine.validate({ schema: item, data: withoutService }))
  })

  test('rejects a negative service id', async ({ assert }) => {
    await assert.rejects(() => vine.validate({ schema: item, data: { ...validItem, service: -1 } }))
  })
})

test.group('offlineOrderValidator', () => {
  const basePayload = {
    name: 'Budi',
    phone: '081387882973',
    totalItems: 1,
    items: [validItem],
  }

  test('accepts cash, debit, and qris as payment methods', async ({ assert }) => {
    for (const paymentMethod of ['cash', 'debit', 'qris']) {
      const result = await offlineOrderValidator.validate({ ...basePayload, paymentMethod })
      assert.equal(result.paymentMethod, paymentMethod)
    }
  })

  test('rejects an unsupported payment method', async ({ assert }) => {
    await assert.rejects(() =>
      offlineOrderValidator.validate({ ...basePayload, paymentMethod: 'crypto' })
    )
  })

  test('rejects an invalid customer phone number', async ({ assert }) => {
    await assert.rejects(() =>
      offlineOrderValidator.validate({ ...basePayload, phone: 'invalid', paymentMethod: 'cash' })
    )
  })

  test('accepts an optional note', async ({ assert }) => {
    const result = await offlineOrderValidator.validate({
      ...basePayload,
      paymentMethod: 'cash',
      note: 'Sepatu titipan',
    })

    assert.equal(result.note, 'Sepatu titipan')
  })
})
