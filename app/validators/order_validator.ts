import vine from '@vinejs/vine'
import type { Infer } from '@vinejs/vine/types'
import { image, name, note, phone, item } from '#validators/shared'
import { PaymentMethod } from '#enums/transaction_enum'

export const orderValidator = vine.create({
  addressId: vine.number().positive(),
  pickupDate: vine.date(),
})

export const customerValidator = vine.create({
  phone: phone(),
})

export const offlineOrderValidator = vine.create({
  name: name(),
  phone: phone(),
  totalItems: vine.number(),
  items: vine.array(item),
  note: note(),
  paymentMethod: vine.enum(Object.values(PaymentMethod)),
})

export const completeTaskValidator = vine.create({
  photo: image(),
})

export const inspectionValidator = vine.create({
  photo: image(),
  items: vine.array(item),
})

/**
 * Marking a batch washed records the "after" half of the before/after pair,
 * so the photo is as required here as it is at every other stage.
 */
export const cleaningValidator = vine.create({
  photo: image(),
})

/**
 * Correcting the items on an order that has been inspected but not yet paid.
 * The payload is the whole list, not a patch: the form always submits every
 * row it is showing.
 */
export const orderItemsValidator = vine.create({
  items: vine.array(item),
})

export type OrderData = Infer<typeof orderValidator>
export type CustomerData = Infer<typeof customerValidator>
export type OfflineOrderData = Infer<typeof offlineOrderValidator>
export type CompleteTaskData = Infer<typeof completeTaskValidator>
export type InspectionData = Infer<typeof inspectionValidator>
export type CleaningData = Infer<typeof cleaningValidator>
export type OrderItemsData = Infer<typeof orderItemsValidator>
