import vine from '@vinejs/vine'
import type { Infer } from '@vinejs/vine/types'
import { ServiceCategory, ServiceType } from '#enums/service_enum'

/**
 * A catalogue entry's name is not a person's name: it carries digits and
 * punctuation ("Cuci Sepatu 2x", "Reparasi Sol - Lem"), so the shared `name()`
 * rule with its alpha-only constraint would reject perfectly ordinary services.
 */
const serviceName = () => vine.string().trim().minLength(3).maxLength(100)

/**
 * Prices are whole Rupiah. The column is a decimal, but no service in this
 * business is ever priced in cents, and a fractional price would print oddly
 * on the receipt.
 */
const servicePrice = () => vine.number().positive().max(100_000_000)

/**
 * The field is called `serviceName`, not `name`, on purpose.
 *
 * The app-wide label for `name` is "Nama lengkap" — right on a signup form,
 * nonsense on a price list. Naming the field for what it actually holds lets
 * it carry its own label from the shared table, instead of this one form
 * bolting a whole replacement messages provider onto itself to override a
 * single word.
 */
export const serviceValidator = vine.create({
  serviceName: serviceName(),
  description: vine.string().trim().minLength(3).maxLength(255),
  price: servicePrice(),
  category: vine.enum(Object.values(ServiceCategory)),
  type: vine.enum(Object.values(ServiceType)),
})

export type ServiceData = Infer<typeof serviceValidator>
