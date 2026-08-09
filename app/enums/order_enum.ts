export const OrderType = {
  ONLINE: 'online',
  OFFLINE: 'offline',
  WALK_IN_DELIVERY: 'walk_in_delivery',
} as const

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

export const OrderTypeLabel = {
  [OrderType.ONLINE]: 'Online',
  [OrderType.OFFLINE]: 'Offline',
  [OrderType.WALK_IN_DELIVERY]: 'Offline + Antar',
} as const

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

export type OrderType = (typeof OrderType)[keyof typeof OrderType]
export type OrderStatus = (typeof OrderStatus)[keyof typeof OrderStatus]

export const WALK_IN_TYPES: string[] = [OrderType.OFFLINE, OrderType.WALK_IN_DELIVERY]
