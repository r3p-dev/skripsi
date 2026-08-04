import vine from '@vinejs/vine'
import type { Infer } from '@vinejs/vine/types'
import { name, password, phone } from '#validators/shared'

export const loginValidator = vine.create({
  phone: phone(),
  password: password(),
  rememberMe: vine.boolean().optional(),
})

export const signupValidator = vine.create({
  name: name(),
  phone: phone().unique({ table: 'users', column: 'phone' }),
  password: password().confirmed({ as: 'passwordConfirmation' }),
})

export const forgotPasswordValidator = vine.create({
  phone: phone(),
})

export const resetPasswordValidator = vine.create({
  password: password().confirmed({ as: 'passwordConfirmation' }),
})

export type LoginData = Infer<typeof loginValidator>
export type SignupData = Infer<typeof signupValidator>
export type ForgotPasswordData = Infer<typeof forgotPasswordValidator>
export type ResetPasswordData = Infer<typeof resetPasswordValidator>
