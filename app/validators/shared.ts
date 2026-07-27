import vine from '@vinejs/vine'
import type { Infer } from '@vinejs/vine/types'

export const name = () =>
  vine
    .string()
    .trim()
    .minLength(1)
    .maxLength(50)
    .alpha({ allowSpaces: true, allowDashes: true, allowUnderscores: false })

export const phone = () =>
  vine
    .string()
    .trim()
    .regex(/^08[1-9]\d{8,10}$/)

export const password = () =>
  vine
    .string()
    .trim()
    .minLength(8)
    .maxLength(16)
    .regex(/^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,16}$/)

export const amount = () => vine.number().positive()

export const image = () =>
  vine.file({
    size: '5mb',
    extnames: ['png', 'jpg', 'jpeg'],
  })

export const note = () => vine.string().trim().optional()

export const service = () => vine.number().positive()

export const item = vine.object({
  brand: vine.string().trim(),
  model: vine.string().trim(),
  type: vine.string().trim(),
  size: vine.string().trim(),
  material: vine.string().trim(),
  condition: vine.string().trim(),
  note: note(),
  service: service(),
  additionalServices: vine.array(service()).optional(),
})

export type Filters = {
  search: string
  page: number
}

export type ItemData = Infer<typeof item>
