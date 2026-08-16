import vine from '@vinejs/vine'
import type { Infer } from '@vinejs/vine/types'
import { ItemType } from '#enums/item_enum'
import { PaymentMethod } from '#enums/transaction_enum'
import { MAX_ITEMS_PER_ORDER } from '#validators/order_validator'
import { image, name, note, phone } from '#validators/shared'

export const taskPhotoValidator = vine.create({
  photo: image(),
})

export const inspectedItem = vine.object({
  type: vine.enum(Object.values(ItemType)),
  brand: vine.string().trim().maxLength(50),
  model: vine.string().trim().maxLength(50),
  size: vine.string().trim().maxLength(20),
  material: vine.string().trim().maxLength(50),
  condition: vine.string().trim().maxLength(255),
  note: note(),
  catalogue: vine.number().positive(),
  additionalCatalogues: vine.array(vine.number().positive()).optional(),
})

export const inspectionValidator = vine.create({
  photo: image(),
  items: vine.array(inspectedItem).minLength(1).maxLength(MAX_ITEMS_PER_ORDER),
})

/**
 * A counter order: the customer is standing there, so the goods, the price and
 * the money all land in one submission.
 *
 * `customerId` is optional because walk-ins need not have an account, but
 * asking for delivery requires one — that is where the address lives.
 */
export const offlineOrderValidator = vine.create({
  customerId: vine.number().positive().optional(),
  name: name(),
  phone: phone(),
  delivery: vine.boolean().optional(),
  items: vine.array(inspectedItem).minLength(1).maxLength(MAX_ITEMS_PER_ORDER),
  photo: image(),
  note: note(),
  paymentMethod: vine.enum(Object.values(PaymentMethod)),
  cashReceived: vine
    .number()
    .positive()
    .optional()
    .requiredWhen('paymentMethod', '=', PaymentMethod.CASH),
})

/**
 * Correcting the goods on an order that has been priced but not yet paid.
 */
export const orderItemsValidator = vine.create({
  items: vine.array(inspectedItem).minLength(1).maxLength(MAX_ITEMS_PER_ORDER),
})

export type TaskPhotoData = Infer<typeof taskPhotoValidator>
export type InspectionData = Infer<typeof inspectionValidator>
export type InspectedItemData = InspectionData['items'][number]
export type OfflineOrderData = Infer<typeof offlineOrderValidator>
export type OrderItemsData = Infer<typeof orderItemsValidator>
