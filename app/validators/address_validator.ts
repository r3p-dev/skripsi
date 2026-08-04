import vine from '@vinejs/vine'
import { name, note, phone } from '#validators/shared'
import type { Infer } from '@vinejs/vine/types'

export const addressValidator = vine.create({
  name: name(),
  phone: phone(),
  street: vine.string().trim().maxLength(255),
  latitude: vine.number().min(-90).max(90),
  longitude: vine.number().min(-180).max(180),
  note: note(),
})

export type AddressData = Infer<typeof addressValidator>
