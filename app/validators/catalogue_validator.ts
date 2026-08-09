import vine from '@vinejs/vine'
import type { Infer } from '@vinejs/vine/types'
import { price } from '#validators/shared'
import { CatalogueCategory, CatalogueType } from '#enums/catalogue_enum'

export const catalogueValidator = vine.create({
  serviceName: vine.string().trim().minLength(3).maxLength(100),
  description: vine.string().trim().minLength(3).maxLength(255),
  price: price(),
  category: vine.enum(Object.values(CatalogueCategory)),
  type: vine.enum(Object.values(CatalogueType)),
})

export type CatalogueData = Infer<typeof catalogueValidator>
