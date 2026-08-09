export const CatalogueType = {
  REGULAR: 'regular',
  START_FROM: 'start_from',
  ADDITIONAL: 'additional',
} as const

export const CatalogueCategory = {
  SHOE_WASH: 'shoe_wash',
  BAG_WASH: 'bag_wash',
  HELMET_WASH: 'helmet_wash',
  SHOE_REPAIR: 'shoe_repair',
  ADDITIONAL: 'additional',
} as const

export const CatalogueTypeLabel = {
  [CatalogueType.REGULAR]: 'Harga',
  [CatalogueType.START_FROM]: 'Mulai dari',
  [CatalogueType.ADDITIONAL]: 'Tambahan',
} as const

export const CatalogueCategoryLabel = {
  [CatalogueCategory.SHOE_WASH]: 'Cuci Sepatu',
  [CatalogueCategory.BAG_WASH]: 'Cuci Tas',
  [CatalogueCategory.HELMET_WASH]: 'Cuci Helm',
  [CatalogueCategory.SHOE_REPAIR]: 'Reparasi Sepatu',
  [CatalogueCategory.ADDITIONAL]: 'Tambahan',
} as const

export type CatalogueType = (typeof CatalogueType)[keyof typeof CatalogueType]
export type CatalogueCategory = (typeof CatalogueCategory)[keyof typeof CatalogueCategory]
