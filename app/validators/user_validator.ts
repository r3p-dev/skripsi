import vine from '@vinejs/vine'
import type { Infer } from '@vinejs/vine/types'
import { name, password, phone } from '#validators/shared'
import { Role } from '#enums/role_enum'

export const userValidator = vine.create({
  name: name(),
  phone: phone().unique({ table: 'users', column: 'phone' }),
  password: password().confirmed({ as: 'passwordConfirmation' }),
  role: vine.enum(Object.values(Role)),
})

export type UserData = Infer<typeof userValidator>
