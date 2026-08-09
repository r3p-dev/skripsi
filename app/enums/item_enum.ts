import { CatalogueCategory } from '#enums/catalogue_enum'

export const ItemType = {
  SHOE: 'shoe',
  BAG: 'bag',
  HELMET: 'helmet',
} as const

export const ItemTypeLabel = {
  [ItemType.SHOE]: 'Sepatu',
  [ItemType.BAG]: 'Tas',
  [ItemType.HELMET]: 'Helm',
} as const

export type ItemType = (typeof ItemType)[keyof typeof ItemType]

export const ItemTypeCategories: Record<ItemType, CatalogueCategory[]> = {
  [ItemType.SHOE]: [CatalogueCategory.SHOE_WASH, CatalogueCategory.SHOE_REPAIR],
  [ItemType.BAG]: [CatalogueCategory.BAG_WASH],
  [ItemType.HELMET]: [CatalogueCategory.HELMET_WASH],
}
