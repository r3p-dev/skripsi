import { OrderStatus } from '#enums/order_enum'

export const TaskType = {
  PICKUP: 'pickup',
  DELIVERY: 'delivery',
  INSPECTION: 'inspection',
  CLEANING: 'cleaning',
  COLLECTION: 'collection',
} as const

export const TaskTypeLabel = {
  [TaskType.PICKUP]: 'Penjemputan',
  [TaskType.DELIVERY]: 'Pengantaran',
  [TaskType.INSPECTION]: 'Inspeksi',
  [TaskType.CLEANING]: 'Selesai Cuci',
  [TaskType.COLLECTION]: 'Siap Diambil',
} as const

export type TaskType = (typeof TaskType)[keyof typeof TaskType]

export const TRIP_TYPES = [TaskType.PICKUP, TaskType.DELIVERY] as const

export type TripType = (typeof TRIP_TYPES)[number]

export function isTripType(value: string): value is TripType {
  return (TRIP_TYPES as readonly string[]).includes(value)
}

export const TASK_SOURCE_STATUS: Record<TaskType, OrderStatus> = {
  [TaskType.PICKUP]: OrderStatus.PICKUP_SCHEDULED,
  [TaskType.INSPECTION]: OrderStatus.IN_PICKUP,
  [TaskType.CLEANING]: OrderStatus.IN_CLEANING,
  [TaskType.DELIVERY]: OrderStatus.IN_DELIVERY,
  [TaskType.COLLECTION]: OrderStatus.CLEANING_DONE,
}

export const CLAIM_DURATION_HOURS = 3
