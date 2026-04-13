import vine from '@vinejs/vine'

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
    .mobile((field) => {
      return {
        locale: ['id-ID'],
        strictMode: false,
      }
    })

export const password = () =>
  vine
    .string()
    .trim()
    .minLength(8)
    .maxLength(16)
    .regex(/^(?=.*\d)[A-Za-z\d]{8,16}$/)

export const amount = () => vine.number().positive()

export const image = () =>
  vine.file({
    size: '5mb',
    extnames: ['png', 'jpg', 'jpeg'],
  })

export const note = () => vine.string().trim().optional()

export const service = () => vine.number().positive()

export const shoe = vine.object({
  brand: vine.string().trim(),
  type: vine.string().trim(),
  size: vine.number().positive(),
  material: vine.string().trim(),
  category: vine.string().trim(),
  condition: vine.string().trim(),
  note: note(),
  service: service(),
  additionalServices: vine.array(service()).optional(),
})
