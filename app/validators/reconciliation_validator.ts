import vine from '@vinejs/vine'
import type { Infer } from '@vinejs/vine/types'
import { MANUAL_PAYMENT_METHODS } from '#enums/transaction_enum'

/**
 * Forcing an order past payment without Midtrans confirming it.
 *
 * Only the two counter methods are on offer. A QRIS payment is always a
 * Midtrans charge confirmed by Midtrans, so ticking one off by hand would be
 * asserting something only the provider can know, and would quietly paper over
 * a broken webhook instead of surfacing it. When the money arrived as cash or
 * on the card machine there is a person who watched it happen, and that person
 * is who this form is for.
 *
 * The note is required, not optional: this is the one action in the product
 * that asserts money changed hands on nothing but an admin's word, and the
 * record of it is worthless if it does not say why.
 */
export const reconciliationValidator = vine.create({
  paymentMethod: vine.enum(MANUAL_PAYMENT_METHODS),
  note: vine.string().trim().minLength(5).maxLength(255),
})

export type ReconciliationData = Infer<typeof reconciliationValidator>
