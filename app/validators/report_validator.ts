import vine from '@vinejs/vine'
import type { Infer } from '@vinejs/vine/types'

/**
 * The window a revenue report covers. Both ends are optional: an admin
 * opening the page without picking anything gets the service's default
 * window rather than an error.
 */
export const reportValidator = vine.create({
  from: vine.date().optional(),
  to: vine.date().optional(),
})

export type ReportRange = Infer<typeof reportValidator>
