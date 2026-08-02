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

/**
 * A stand-in for the uploaded intake photo.
 *
 * `vine.file()` only asks that the value be a bodyparser multipart file and
 * then delegates to the file's own `validate()`. A unit test of the payload's
 * other rules has no upload to hand and no interest in one, so this is the
 * smallest thing that satisfies the rule — the real upload path is covered in
 * the functional suite.
 */
const uploadedPhoto = {
  isMultipartFile: true as const,
  extname: 'png',
  errors: [] as { message: string; type: string }[],
  isValid: true,
  validate() {},
}

test.group('offlineOrderValidator', () => {
  const basePayload = {
    name: 'Budi',
    phone: '081387882973',
    totalItems: 1,
    items: [validItem],
    photo: uploadedPhoto,
  }

  /**
   * `totalItems` is the form's own field: how many item forms the page should
   * draw, stated before any of them is filled in. It is not `items.length`
   * under another name, and the two legitimately differ while the form is
   * being completed.
   */
  test("carries the form's own item count, separate from the items themselves", async ({
    assert,
  }) => {
    const result = await offlineOrderValidator.validate({
      ...basePayload,
      totalItems: 3,
      paymentMethod: 'cash',
    })

    assert.equal(result.totalItems, 3)
    assert.lengthOf(result.items, 1)
  })

  test('accepts the cash tendered so the change can be worked out', async ({ assert }) => {
    const result = await offlineOrderValidator.validate({
      ...basePayload,
      paymentMethod: 'cash',
      cashReceived: 100000,
    })

    assert.equal(result.cashReceived, 100000)
  })

  test('accepts a delivery request bound to a registered customer', async ({ assert }) => {
    const result = await offlineOrderValidator.validate({
      ...basePayload,
      paymentMethod: 'cash',
      customerId: 7,
      delivery: true,
    })

    assert.equal(result.customerId, 7)
    assert.isTrue(result.delivery)
  })

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
