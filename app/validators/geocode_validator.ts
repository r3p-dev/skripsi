import vine from '@vinejs/vine'
import type { Infer } from '@vinejs/vine/types'

export const geocodeValidator = vine.create({
  query: vine.string().trim().minLength(3).maxLength(255),
})

export type GeocodeData = Infer<typeof geocodeValidator>

export const nearbyValidator = vine.create({
  latitude: vine.number().min(-90).max(90),
  longitude: vine.number().min(-180).max(180),
})

export type NearbyData = Infer<typeof nearbyValidator>
