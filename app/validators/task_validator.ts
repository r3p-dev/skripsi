import vine from '@vinejs/vine'
import { image, shoe } from './validator.ts'

export const photoValidator = vine.create({
  image: image(),
})

export const cancelTaskValidator = vine.create({
  reason: vine.string().trim().minLength(1),
})

export const inspectionValidator = vine.create({
  totalShoes: vine.number(),
  shoes: vine.array(shoe),
  image: image(),
})
