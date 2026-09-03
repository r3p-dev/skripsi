export const ActionName = {
  OFFLINE_ORDER: 'offline_order',
  PICKUP: 'pickup',
  INSPECTION: 'inspection',
  CLEANING_DONE: 'cleaning_done',
  READY_NOTICE_SENT: 'ready_notice_sent',
  PAYMENT_REMINDER_SENT: 'payment_reminder_sent',
  DELIVERY: 'delivery',
  COLLECTED: 'collected',
} as const

export const ActionNameLabel = {
  [ActionName.OFFLINE_ORDER]: 'Barang Diterima di Toko',
  [ActionName.PICKUP]: 'Barang Dijemput',
  [ActionName.INSPECTION]: 'Inspeksi Selesai',
  [ActionName.CLEANING_DONE]: 'Selesai Dicuci',
  [ActionName.READY_NOTICE_SENT]: 'Pelanggan Dikabari',
  [ActionName.PAYMENT_REMINDER_SENT]: 'Pengingat Pembayaran Dikirim',
  [ActionName.DELIVERY]: 'Barang Diantar',
  [ActionName.COLLECTED]: 'Barang Diambil Pelanggan',
} as const

export type ActionName = (typeof ActionName)[keyof typeof ActionName]

export const PHOTO_ACTIONS: readonly ActionName[] = [
  ActionName.OFFLINE_ORDER,
  ActionName.PICKUP,
  ActionName.INSPECTION,
  ActionName.CLEANING_DONE,
  ActionName.DELIVERY,
  ActionName.COLLECTED,
]
