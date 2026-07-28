import vine, { SimpleMessagesProvider } from '@vinejs/vine'
import type { Infer } from '@vinejs/vine/types'
import { ServiceCategory, ServiceType } from '#enums/service_enum'
import { validationFields, validationMessages } from '#start/validator'

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

export const serviceValidator = vine.create({
  name: serviceName(),
  description: vine.string().trim().minLength(3).maxLength(255),
  price: servicePrice(),
  category: vine.enum(Object.values(ServiceCategory)),
  type: vine.enum(Object.values(ServiceType)),
})

/**
 * The app-wide label for `name` is "Nama lengkap", which is right on a signup
 * form and nonsense on a catalogue entry. Only that one label differs, so the
 * shared rule wording is reused rather than restated.
 */
serviceValidator.messagesProvider = new SimpleMessagesProvider(validationMessages, {
  ...validationFields,
  name: 'Nama layanan',
})

export type ServiceData = Infer<typeof serviceValidator>
