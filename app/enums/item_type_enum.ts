/**
 * Enum representing the item type of an item.
 */
export const ItemType = {
  SHOE: 'shoe',
  BAG: 'bag',
  HELMET: 'helmet',
} as const

/**
 * Type representing the item type of an item.
 */
export type ItemType = (typeof ItemType)[keyof typeof ItemType]

/**
 * Customer-facing labels for item types.
 */
export const ItemTypeLabel = {
  [ItemType.SHOE]: 'Sepatu',
  [ItemType.BAG]: 'Tas',
  [ItemType.HELMET]: 'Helmet',
} as const
