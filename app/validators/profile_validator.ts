import vine from '@vinejs/vine'
import { name, note, password, phone } from './validator.ts'

export const updatePasswordValidator = vine.create({
  current_password: password(),
  password: password().confirmed(),
})

export const addressValidator = vine.create({
  name: name(),
  phone: phone(),
  street: vine.string().trim().maxLength(255),
  latitude: vine.number().min(-90).max(90),
  longitude: vine.number().min(-180).max(180),
  radius: vine.number().positive().max(40000),
  note: note(),
})
