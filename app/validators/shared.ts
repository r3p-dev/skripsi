import vine from '@vinejs/vine'
import { phoneRule } from '@julienbenac/vine-plugin-phone'

export const name = () =>
  vine
    .string()
    .trim()
    .minLength(1)
    .maxLength(50)
    .alpha({ allowSpaces: true, allowDashes: true, allowUnderscores: false })

export const phone = () => vine.string().use(phoneRule({ countryCode: 'ID' }))

export const password = () =>
  vine
    .string()
    .trim()
    .minLength(8)
    .maxLength(16)
    .regex(/^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,16}$/)

export const price = () => vine.number().positive().max(100_000_000)

export const image = () =>
  vine.file({
    size: '5mb',
    extnames: ['png', 'jpg', 'jpeg'],
  })

export const note = () => vine.string().trim().optional()

export type Filters = {
  search: string
  page: number
}
