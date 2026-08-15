import vine from '@vinejs/vine'
import type { Infer } from '@vinejs/vine/types'
import { ItemType } from '#enums/item_enum'
import { note } from '#validators/shared'

export const MAX_ITEMS_PER_ORDER = 10

const orderItem = vine.object({
  type: vine.enum(Object.values(ItemType)),
  brand: vine.string().trim().maxLength(50),
  model: vine.string().trim().maxLength(50),
  size: vine.string().trim().maxLength(20),
  material: vine.string().trim().maxLength(50),
  note: note(),
})

export const orderValidator = vine.create({
  pickupDate: vine.date().after('today'),
  items: vine.array(orderItem).minLength(1).maxLength(MAX_ITEMS_PER_ORDER),
})

export type OrderData = Infer<typeof orderValidator>
export type OrderItemData = OrderData['items'][number]
