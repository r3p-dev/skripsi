import vine from '@vinejs/vine'
import type { Infer } from '@vinejs/vine/types'
import { PaymentMethod } from '#enums/transaction_enum'

/**
 * Forcing an order past payment without Midtrans confirming it.
 *
 * The note is required, not optional: this is the one action in the product
 * that asserts money changed hands on nothing but an admin's word, and the
 * record of it is worthless if it does not say why.
 */
export const reconciliationValidator = vine.create({
  paymentMethod: vine.enum(Object.values(PaymentMethod)),
  note: vine.string().trim().minLength(5).maxLength(255),
})

export type ReconciliationData = Infer<typeof reconciliationValidator>
