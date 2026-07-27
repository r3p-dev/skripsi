/**
 * Enum representing the names of order actions.
 */
export const ActionName = {
  PICKUP: 'pickup',
  DELIVERY: 'delivery',
  INSPECTION: 'inspection',
  ATTEMPT_PICKUP: 'attempt_pickup',
  ATTEMPT_DELIVERY: 'attempt_delivery',
  ATTEMPT_INSPECTION: 'attempt_inspection',
  RELEASE_PICKUP: 'release_pickup',
  RELEASE_DELIVERY: 'release_delivery',
  RELEASE_INSPECTION: 'release_inspection',
  OFFLINE_ORDER: 'offline_order',
} as const

/**
 * Customer-facing labels for order action names.
 * These labels are used in the UI to provide a more user-friendly representation of the enum values.
 */
export const ActionNameLabel = {
  [ActionName.PICKUP]: 'Penjemputan Selesai',
  [ActionName.DELIVERY]: 'Pengantaran Selesai',
  [ActionName.INSPECTION]: 'Inspeksi Selesai',
  [ActionName.ATTEMPT_PICKUP]: 'Tugas Penjemputan Diambil',
  [ActionName.ATTEMPT_DELIVERY]: 'Tugas Pengantaran Diambil',
  [ActionName.ATTEMPT_INSPECTION]: 'Tugas Inspeksi Diambil',
  [ActionName.RELEASE_PICKUP]: 'Tugas Penjemputan Dibatalkan',
  [ActionName.RELEASE_DELIVERY]: 'Tugas Pengantaran Dibatalkan',
  [ActionName.RELEASE_INSPECTION]: 'Tugas Inspeksi Dibatalkan',
  [ActionName.OFFLINE_ORDER]: 'Pesanan Offline',
} as const

/**
 * Type representing the names of order actions.
 */
export type ActionName = (typeof ActionName)[keyof typeof ActionName]
