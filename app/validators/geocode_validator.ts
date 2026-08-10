import vine from '@vinejs/vine'
import type { Infer } from '@vinejs/vine/types'

export const geocodeValidator = vine.create({
  query: vine.string().trim().minLength(3).maxLength(255),
})

export type GeocodeData = Infer<typeof geocodeValidator>
