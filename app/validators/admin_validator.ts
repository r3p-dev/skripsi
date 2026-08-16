import vine from '@vinejs/vine'
import type { Infer } from '@vinejs/vine/types'
import { Role } from '#enums/role_enum'
import { PaymentMethod } from '#enums/transaction_enum'
import { name, password, phone } from '#validators/shared'

export const adminUserValidator = vine.create({
  name: name(),
  phone: phone(),
  role: vine.enum(Object.values(Role)),
  isActive: vine.boolean().optional(),
  password: password().confirmed({ as: 'passwordConfirmation' }).optional(),
})

export const reconciliationValidator = vine.create({
  paymentMethod: vine.enum(Object.values(PaymentMethod)),
  note: vine.string().trim().minLength(5).maxLength(255),
})

export const reportRangeValidator = vine.create({
  from: vine.date().optional(),
  to: vine.date().optional(),
})

export type AdminUserData = Infer<typeof adminUserValidator>
export type ReconciliationData = Infer<typeof reconciliationValidator>
export type ReportRangeData = Infer<typeof reportRangeValidator>
