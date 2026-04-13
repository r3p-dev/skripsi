import vine from '@vinejs/vine'
import { name, password, phone } from './validator.ts'

export const loginValidator = vine.create({
  phone: phone(),
  password: password(),
  remember_me: vine.boolean().optional(),
})

export const registerValidator = vine.create({
  name: name(),
  phone: phone(),
  password: password().confirmed(),
})

export const forgotPasswordValidator = vine.create({
  phone: phone(),
})

export const resetPasswordValidator = vine.create({
  password: password().confirmed(),
})
