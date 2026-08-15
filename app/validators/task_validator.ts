import vine from '@vinejs/vine'
import type { Infer } from '@vinejs/vine/types'
import { ItemType } from '#enums/item_enum'
import { MAX_ITEMS_PER_ORDER } from '#validators/order_validator'
import { image, note } from '#validators/shared'

export const taskPhotoValidator = vine.create({
  photo: image(),
})

const inspectedItem = vine.object({
  type: vine.enum(Object.values(ItemType)),
  brand: vine.string().trim().maxLength(50),
  model: vine.string().trim().maxLength(50),
  size: vine.string().trim().maxLength(20),
  material: vine.string().trim().maxLength(50),
  condition: vine.string().trim().maxLength(255),
  note: note(),
  service: vine.number().positive(),
  additionalServices: vine.array(vine.number().positive()).optional(),
})

export const inspectionValidator = vine.create({
  photo: image(),
  items: vine.array(inspectedItem).minLength(1).maxLength(MAX_ITEMS_PER_ORDER),
})

export type TaskPhotoData = Infer<typeof taskPhotoValidator>
export type InspectionData = Infer<typeof inspectionValidator>
export type InspectedItemData = InspectionData['items'][number]
