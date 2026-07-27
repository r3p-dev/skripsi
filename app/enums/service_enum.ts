/**
 * Enum representing the different service types, categories, and item types available in the application.
 */
export const ServiceType = {
  REGULAR: 'regular',
  START_FROM: 'start_from',
  ADDITIONAL: 'additional',
} as const

export const ServiceCategory = {
  SHOE_WASH: 'shoe_wash',
  BAG_WASH: 'bag_wash',
  HELMET_WASH: 'helmet_wash',
  SHOE_REPAIR: 'shoe_repair',
  ADDITIONAL: 'additional',
} as const

export const ItemType = {
  SHOE: 'shoe',
  BAG: 'bag',
  HELMET: 'helmet',
} as const

/**
 * Customer-facing labels for the service types, categories, and item types.
 * These labels are used in the UI to provide a more user-friendly representation of the enum values.
 */
export const ServiceTypeLabel = {
  [ServiceType.REGULAR]: 'Harga',
  [ServiceType.START_FROM]: 'Mulai dari',
  [ServiceType.ADDITIONAL]: 'Tambahan',
} as const

export const ServiceCategoryLabel = {
  [ServiceCategory.SHOE_WASH]: 'Cuci Sepatu',
  [ServiceCategory.BAG_WASH]: 'Cuci Tas',
  [ServiceCategory.HELMET_WASH]: 'Cuci Helm',
  [ServiceCategory.SHOE_REPAIR]: 'Reparasi Sepatu',
  [ServiceCategory.ADDITIONAL]: 'Tambahan',
} as const

export const ItemTypeLabel = {
  [ItemType.SHOE]: 'Sepatu',
  [ItemType.BAG]: 'Tas',
  [ItemType.HELMET]: 'Helmet',
} as const

/**
 * Type representing the service type, category, and item type.
 */
export type ServiceType = (typeof ServiceType)[keyof typeof ServiceType]
export type ServiceCategory = (typeof ServiceCategory)[keyof typeof ServiceCategory]
export type ItemType = (typeof ItemType)[keyof typeof ItemType]
