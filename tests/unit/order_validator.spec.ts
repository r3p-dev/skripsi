import { test } from '@japa/runner'
import { ItemType } from '#enums/item_enum'
import { MAX_ITEMS_PER_ORDER, orderValidator } from '#validators/order_validator'
import { invalidFields } from '#tests/utils/helpers'
import { DateTime } from 'luxon'

function item(overrides: Record<string, unknown> = {}) {
  return {
    type: ItemType.SHOE,
    brand: 'Nike',
    model: 'Air Force 1',
    size: '42',
    material: 'Kanvas',
    ...overrides,
  }
}

function tomorrow(): string {
  return DateTime.now().plus({ days: 1 }).toISODate()!
}

test.group('orderValidator | the pickup day', () => {
  test('accepts a day after today', async ({ assert }) => {
    const payload = await orderValidator.validate({
      pickupDate: tomorrow(),
      items: [item()],
    })

    assert.isTrue(DateTime.isDateTime(payload.pickupDate))
    assert.equal(payload.pickupDate.toISODate(), tomorrow())
  })

  test('refuses today', async ({ assert }) => {
    const fields = await invalidFields(() =>
      orderValidator.validate({ pickupDate: DateTime.now().toISODate(), items: [item()] })
    )

    assert.include(fields, 'pickupDate')
  })

  test('refuses a day in the past', async ({ assert }) => {
    const fields = await invalidFields(() =>
      orderValidator.validate({
        pickupDate: DateTime.now().minus({ days: 1 }).toISODate(),
        items: [item()],
      })
    )

    assert.include(fields, 'pickupDate')
  })

  test('refuses a date that is not a date', async ({ assert }) => {
    const fields = await invalidFields(() =>
      orderValidator.validate({ pickupDate: 'besok', items: [item()] })
    )

    assert.include(fields, 'pickupDate')
  })

  test('demands a pickup day', async ({ assert }) => {
    const fields = await invalidFields(() => orderValidator.validate({ items: [item()] }))

    assert.include(fields, 'pickupDate')
  })
})

test.group('orderValidator | the goods', () => {
  test('accepts every kind of goods this laundry handles', async ({ assert }) => {
    const payload = await orderValidator.validate({
      pickupDate: tomorrow(),
      items: [
        item({ type: ItemType.SHOE }),
        item({ type: ItemType.BAG, size: 'M' }),
        item({ type: ItemType.HELMET, size: 'L' }),
      ],
    })

    assert.lengthOf(payload.items, 3)
  })

  test('refuses an empty order', async ({ assert }) => {
    const fields = await invalidFields(() =>
      orderValidator.validate({ pickupDate: tomorrow(), items: [] })
    )

    assert.include(fields, 'items')
  })

  test('demands a list of goods', async ({ assert }) => {
    const fields = await invalidFields(() => orderValidator.validate({ pickupDate: tomorrow() }))

    assert.include(fields, 'items')
  })

  test(`accepts exactly ${MAX_ITEMS_PER_ORDER} items`, async ({ assert }) => {
    const payload = await orderValidator.validate({
      pickupDate: tomorrow(),
      items: Array.from({ length: MAX_ITEMS_PER_ORDER }, () => item()),
    })

    assert.lengthOf(payload.items, MAX_ITEMS_PER_ORDER)
  })

  test('refuses one item more than the limit', async ({ assert }) => {
    const fields = await invalidFields(() =>
      orderValidator.validate({
        pickupDate: tomorrow(),
        items: Array.from({ length: MAX_ITEMS_PER_ORDER + 1 }, () => item()),
      })
    )

    assert.include(fields, 'items')
  })

  test('refuses a kind of goods that is not on the list', async ({ assert }) => {
    const fields = await invalidFields(() =>
      orderValidator.validate({ pickupDate: tomorrow(), items: [item({ type: 'jaket' })] })
    )

    assert.include(fields, 'items.0.type')
  })

  test('demands the details of each item', async ({ assert }) => {
    const fields = await invalidFields(() =>
      orderValidator.validate({ pickupDate: tomorrow(), items: [{ type: ItemType.SHOE }] })
    )

    assert.includeMembers(fields, [
      'items.0.brand',
      'items.0.model',
      'items.0.size',
      'items.0.material',
    ])
  })

  test('points at the item that is wrong, not the first one', async ({ assert }) => {
    const fields = await invalidFields(() =>
      orderValidator.validate({
        pickupDate: tomorrow(),
        items: [item(), item({ type: 'jaket' })],
      })
    )

    assert.include(fields, 'items.1.type')
  })

  test('refuses a brand longer than fifty characters', async ({ assert }) => {
    const fields = await invalidFields(() =>
      orderValidator.validate({
        pickupDate: tomorrow(),
        items: [item({ brand: 'a'.repeat(51) })],
      })
    )

    assert.include(fields, 'items.0.brand')
  })

  test('refuses a size longer than twenty characters', async ({ assert }) => {
    const fields = await invalidFields(() =>
      orderValidator.validate({
        pickupDate: tomorrow(),
        items: [item({ size: 'a'.repeat(21) })],
      })
    )

    assert.include(fields, 'items.0.size')
  })

  test('the note on an item is optional', async ({ assert }) => {
    const payload = await orderValidator.validate({
      pickupDate: tomorrow(),
      items: [item()],
    })

    assert.isUndefined(payload.items[0].note)
  })

  test('keeps a note when one is given', async ({ assert }) => {
    const payload = await orderValidator.validate({
      pickupDate: tomorrow(),
      items: [item({ note: '  Ada noda di bagian tumit  ' })],
    })

    assert.equal(payload.items[0].note, 'Ada noda di bagian tumit')
  })

  test('trims the details of each item', async ({ assert }) => {
    const payload = await orderValidator.validate({
      pickupDate: tomorrow(),
      items: [item({ brand: '  Nike  ', model: '  Air Force 1  ' })],
    })

    assert.equal(payload.items[0].brand, 'Nike')
    assert.equal(payload.items[0].model, 'Air Force 1')
  })
})
