/**
 * Enum representing how an order reached the shop.
 */
export const OrderType = {
  /** Booked through the app by a registered customer, collected by staff. */
  ONLINE: 'online',
  /** Walked in at the counter and recorded by staff, no customer account. */
  OFFLINE: 'offline',
} as const

/**
 * Customer-facing labels for order types.
 * These labels are used in the UI to provide a more user-friendly representation of the enum values.
 */
export const OrderTypeLabel = {
  [OrderType.ONLINE]: 'Online',
  [OrderType.OFFLINE]: 'Offline',
} as const

/**
 * Type representing how an order reached the shop.
 */
export type OrderType = (typeof OrderType)[keyof typeof OrderType]
