/**
 * Enum representing how an order reached the shop.
 */
export const OrderType = {
  ONLINE: 'online',
  OFFLINE: 'offline',
  WALK_IN_DELIVERY: 'walk_in_delivery',
} as const

/**
 * Customer-facing labels for order types.
 * These labels are used in the UI to provide a more user-friendly representation of the enum values.
 */
export const OrderTypeLabel = {
  [OrderType.ONLINE]: 'Online',
  [OrderType.OFFLINE]: 'Offline',
  [OrderType.WALK_IN_DELIVERY]: 'Offline + Antar',
} as const

/**
 * The types staff record at the counter, as opposed to the one a customer
 * books for themselves. Both are paid on the spot and skip pickup entirely.
 */
export const WALK_IN_TYPES: string[] = [OrderType.OFFLINE, OrderType.WALK_IN_DELIVERY]

/**
 * Type representing how an order reached the shop.
 */
export type OrderType = (typeof OrderType)[keyof typeof OrderType]
