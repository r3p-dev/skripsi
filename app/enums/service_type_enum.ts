/**
 * Enum representing the service type of a service.
 */
export const ServiceType = {
  REGULAR: 'regular',
  START_FROM: 'start_from',
  ADDITIONAL: 'additional',
} as const

/**
 * Type representing the service type of a service.
 */
export type ServiceType = (typeof ServiceType)[keyof typeof ServiceType]

/**
 * Customer-facing labels for service types.
 */
export const ServiceTypeLabel = {
  [ServiceType.REGULAR]: 'Harga',
  [ServiceType.START_FROM]: 'Mulai dari',
  [ServiceType.ADDITIONAL]: 'Tambahan',
} as const

/**
 * Enum representing the service category of a service.
 */
export const ServiceCategory = {
  SHOE_WASH: 'shoe_wash',
  BAG_WASH: 'bag_wash',
  HELMET_WASH: 'helmet_wash',
  SHOE_REPAIR: 'shoe_repair',
  ADDITIONAL: 'additional',
} as const

/**
 * Type representing the service category of a service.
 */
export type ServiceCategory = (typeof ServiceCategory)[keyof typeof ServiceCategory]

/**
 * Customer-facing labels for service categories.
 */
export const ServiceCategoryLabel = {
  [ServiceCategory.SHOE_WASH]: 'Cuci Sepatu',
  [ServiceCategory.BAG_WASH]: 'Cuci Tas',
  [ServiceCategory.HELMET_WASH]: 'Cuci Helm',
  [ServiceCategory.SHOE_REPAIR]: 'Reparasi Sepatu',
  [ServiceCategory.ADDITIONAL]: 'Tambahan',
} as const
