import vine from '@vinejs/vine'
import type { Infer } from '@vinejs/vine/types'
import { name, password, phone } from '#validators/shared'

export const changePasswordValidator = vine.create({
  currentPassword: password(),
  password: password().confirmed({ as: 'passwordConfirmation' }),
})

export const changeNameValidator = vine.create({
  name: name(),
})

export const changePhoneValidator = vine.create({
  phone: phone(),
})

export type ChangePasswordData = Infer<typeof changePasswordValidator>
export type ChangeNameData = Infer<typeof changeNameValidator>
export type ChangePhoneData = Infer<typeof changePhoneValidator>
