import vine from '@vinejs/vine'
import type { Infer } from '@vinejs/vine/types'
import { name, password, phone } from '#validators/shared'
import { Role, PRIVILEGED_ROLES } from '#enums/role_enum'

export const createUserValidator = vine.create({
  name: name(),
  phone: phone().unique({ table: 'users', column: 'phone' }),
  password: password().confirmed({ as: 'passwordConfirmation' }),
  role: vine.enum(Object.values(Role)),
})

/**
 * The admin-only sign-up form for the people who work here.
 *
 * A staff or admin account has no public route into existence, and this is
 * deliberately not one either: the form lives behind the admin area, and the
 * only roles it offers are the two it exists to create. Customers sign
 * themselves up on the public form — there is no reason for this one to be
 * able to mint one.
 */
export const staffSignupValidator = vine.create({
  name: name(),
  phone: phone().unique({ table: 'users', column: 'phone' }),
  password: password().confirmed({ as: 'passwordConfirmation' }),
  role: vine.enum(PRIVILEGED_ROLES),
})

/**
 * Editing an account, where the password is optional: an admin fixing a
 * misspelled name should not have to invent a new password for that person,
 * and leaving the field blank must mean "leave it alone" rather than "blank it".
 *
 * The phone number is checked against every account *except* this one, so
 * saving a form that did not touch the number is not rejected as a duplicate.
 *
 * `isActive` is how somebody stops working here. Their name is attached to
 * every collection, inspection and delivery they ever recorded, so the account
 * cannot be deleted — it is switched off instead, and the history stays whole.
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
  isActive: vine.boolean().optional(),
})

export type CreateUserData = Infer<typeof createUserValidator>
export type StaffSignupData = Infer<typeof staffSignupValidator>
export type UpdateUserData = Infer<typeof updateUserValidator>
