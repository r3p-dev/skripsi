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
  CLEANING_DONE: 'cleaning_done',
  /** A walk-in customer took their washed shoes home from the counter. */
  COLLECTED: 'collected',
  OFFLINE_ORDER: 'offline_order',
  ITEMS_EDITED: 'items_edited',
  PAYMENT_OVERRIDE: 'payment_override',
  /** Staff sent the customer a WhatsApp asking them to settle the order. */
  PAYMENT_REMINDER_SENT: 'payment_reminder_sent',
  /** Staff sent the customer a WhatsApp telling them the shoes are ready. */
  READY_NOTICE_SENT: 'ready_notice_sent',
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
  [ActionName.CLEANING_DONE]: 'Pencucian Selesai',
  [ActionName.COLLECTED]: 'Diambil Pelanggan',
  [ActionName.OFFLINE_ORDER]: 'Pesanan Offline',
  [ActionName.ITEMS_EDITED]: 'Barang Diperbarui',
  [ActionName.PAYMENT_OVERRIDE]: 'Pembayaran Dikonfirmasi Manual',
  [ActionName.PAYMENT_REMINDER_SENT]: 'Pengingat Pembayaran Dikirim',
  [ActionName.READY_NOTICE_SENT]: 'Pemberitahuan Siap Diambil Dikirim',
} as const

/**
 * Type representing the names of order actions.
 */
export type ActionName = (typeof ActionName)[keyof typeof ActionName]
