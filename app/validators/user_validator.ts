import vine from '@vinejs/vine'
import type { Infer } from '@vinejs/vine/types'
import { name, password, phone } from '#validators/shared'
import { Role } from '#enums/role_enum'

export const createUserValidator = vine.create({
  name: name(),
  phone: phone().unique({ table: 'users', column: 'phone' }),
  password: password().confirmed({ as: 'passwordConfirmation' }),
  role: vine.enum(Object.values(Role)),
})

/**
 * Editing an account, where the password is optional: an admin fixing a
 * misspelled name should not have to invent a new password for that person,
 * and leaving the field blank must mean "leave it alone" rather than "blank it".
 *
 * The phone number is checked against every account *except* this one, so
 * saving a form that did not touch the number is not rejected as a duplicate.
 */
export const updateUserValidator = vine.withMetaData<{ userId: number }>().create({
  name: name(),
  phone: phone().unique({
    table: 'users',
    column: 'phone',
    filter: (query, _value, field) => {
      query.whereNot('id', field.meta.userId)
    },
  }),
  password: password().confirmed({ as: 'passwordConfirmation' }).optional(),
  role: vine.enum(Object.values(Role)),
})

export type CreateUserData = Infer<typeof createUserValidator>
export type UpdateUserData = Infer<typeof updateUserValidator>
