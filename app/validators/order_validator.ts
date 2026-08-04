import vine from '@vinejs/vine'
import type { Infer } from '@vinejs/vine/types'
import { image, name, note, phone, item } from '#validators/shared'
import { PaymentMethod } from '#enums/transaction_enum'

/**
 * Booking a pickup.
 *
 * The date has to be a future one. A collection booked for today cannot
 * actually happen: the van is already out on a route planned this morning,
 * and the customer would be left watching a stop that nobody is coming to.
 * Refusing it at the form is kinder than accepting it and disappointing them.
 */
export const orderValidator = vine.create({
  addressId: vine.number().positive(),
  pickupDate: vine.date().after('today'),
})

export const customerValidator = vine.create({
  phone: phone(),
})

/**
 * Recording an order at the counter.
 *
 * `totalItems` is the form's own field and stays exactly that: it is how many
 * item forms the page should draw, which the customer states before any of
 * them has been filled in. It is not `items.length` under another name —
 * that one is how many have been filled in so far, and the two differ for
 * the whole time the form is being completed.
 */
export const offlineOrderValidator = vine.create({
  /**
   * The account this walk-in belongs to, when staff found the customer in the
   * system rather than typing them in fresh. Optional: most people who walk in
   * have never used the app.
   */
  customerId: vine.number().positive().optional(),
  name: name(),
  phone: phone(),
  totalItems: vine.number(),
  items: vine.array(item),
  note: note(),
  /**
   * The intake photo. A counter order skips inspection entirely, so without
   * one there is no record of what condition the shoes arrived in — which is
   * exactly the record a dispute turns on.
   */
  photo: image(),
  paymentMethod: vine.enum(Object.values(PaymentMethod)),
  /**
   * What the customer handed over, so the system can work out the change
   * instead of somebody reaching for a calculator. Only cash has one.
   */
  cashReceived: vine.number().positive().optional(),
  /**
   * The customer brought the shoes in but wants them delivered back rather
   * than collecting them. Needs an account, because it needs an address.
   */
  delivery: vine.boolean().optional(),
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
