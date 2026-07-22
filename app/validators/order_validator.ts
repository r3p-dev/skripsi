import vine from '@vinejs/vine'
import type { Infer } from '@vinejs/vine/types'
import { name, note, phone, shoe } from '#validators/shared'

/**
 * Validate customer pickup order payloads.
 */
export const orderValidator = vine.create({
  addressId: vine.number().positive(),
  date: vine.date(),
})

/**
 * Validate customer lookup requests by phone number.
 */
export const customerValidator = vine.create({
  phone: phone(),
})

/**
 * Validate staff-created offline order payloads.
 */
export const offlineOrderValidator = vine.create({
  name: name(),
  phone: phone(),
  totalShoes: vine.number(),
  shoes: vine.array(shoe),
  note: note(),
})

/**
 * Type definition for the order data.
 */
export type OrderData = Infer<typeof orderValidator>
export type CustomerData = Infer<typeof customerValidator>
export type OfflineOrderData = Infer<typeof offlineOrderValidator>
