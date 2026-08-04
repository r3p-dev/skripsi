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

  test('accepts the two methods money can arrive by in person', async ({ assert }) => {
    for (const paymentMethod of ['cash', 'debit']) {
      const result = await reconciliationValidator.validate({ ...validOverride, paymentMethod })
      assert.equal(result.paymentMethod, paymentMethod)
    }
  })

  /**
   * A QRIS payment is always a Midtrans charge confirmed by Midtrans, so
   * ticking one off by hand would be asserting something only the provider can
   * know — and would paper over a broken webhook instead of surfacing it.
   * Manual confirmation exists for the money somebody watched change hands.
   */
  test('refuses to settle a QRIS payment by hand', async ({ assert }) => {
    await assert.rejects(() =>
      reconciliationValidator.validate({ ...validOverride, paymentMethod: 'qris' })
    )
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
