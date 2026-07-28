import { reconciliationValidator } from '#validators/reconciliation_validator'
import { test } from '@japa/runner'

const validOverride = {
  paymentMethod: 'cash',
  note: 'Bukti transfer diterima, callback Midtrans tidak masuk',
}

test.group('reconciliationValidator', () => {
  test('accepts an override with a method and a reason', async ({ assert }) => {
    const result = await reconciliationValidator.validate(validOverride)

    assert.equal(result.paymentMethod, 'cash')
    assert.equal(result.note, validOverride.note)
  })

  test('accepts every payment method the shop takes', async ({ assert }) => {
    for (const paymentMethod of ['cash', 'debit', 'qris']) {
      const result = await reconciliationValidator.validate({ ...validOverride, paymentMethod })
      assert.equal(result.paymentMethod, paymentMethod)
    }
  })

  /**
   * The whole value of an override is the record of why it happened, so an
   * empty or throwaway reason is refused rather than quietly stored.
   */
  test('rejects a missing reason', async ({ assert }) => {
    const { note, ...withoutNote } = validOverride

    await assert.rejects(() => reconciliationValidator.validate(withoutNote))
  })

  test('rejects a reason too short to mean anything', async ({ assert }) => {
    await assert.rejects(() => reconciliationValidator.validate({ ...validOverride, note: 'ok' }))
  })

  test('rejects a payment method that is not in the enum', async ({ assert }) => {
    await assert.rejects(() =>
      reconciliationValidator.validate({ ...validOverride, paymentMethod: 'barter' })
    )
  })
})
