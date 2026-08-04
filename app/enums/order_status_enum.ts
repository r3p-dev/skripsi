/**
 * Enum representing the status of an order.
 */
export const OrderStatus = {
  PICKUP_SCHEDULED: 'pickup_scheduled',
  IN_PICKUP: 'in_pickup',
  IN_INSPECTION: 'in_inspection',
  AWAITING_PAYMENT: 'awaiting_payment',
  IN_CLEANING: 'in_cleaning',
  CLEANING_DONE: 'cleaning_done',
  IN_DELIVERY: 'in_delivery',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
} as const

/**
 * Customer-facing labels for order statuses.
 * These labels are used in the UI to provide a more user-friendly representation of the enum values.
 */
export const OrderStatusLabel = {
  [OrderStatus.PICKUP_SCHEDULED]: 'Penjemputan Dijadwalkan',
  [OrderStatus.IN_PICKUP]: 'Dalam Penjemputan',
  [OrderStatus.IN_INSPECTION]: 'Dalam Inspeksi',
  [OrderStatus.AWAITING_PAYMENT]: 'Menunggu Pelunasan',
  [OrderStatus.IN_CLEANING]: 'Dalam Pencucian',
  [OrderStatus.CLEANING_DONE]: 'Siap Diambil',
  [OrderStatus.IN_DELIVERY]: 'Dalam Pengantaran',
  [OrderStatus.COMPLETED]: 'Selesai',
  [OrderStatus.CANCELLED]: 'Dibatalkan',
} as const

/**
 * Type representing the status of an order.
 */
export type OrderStatus = (typeof OrderStatus)[keyof typeof OrderStatus]
