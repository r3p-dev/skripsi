export const TransactionStatus = {
  PENDING: 'pending',
  PAID: 'paid',
  EXPIRED: 'expired',
  CANCELLED: 'cancelled',
  FAILED: 'failed',
} as const

export const PaymentMethod = {
  CASH: 'cash',
  QRIS: 'qris',
  DEBIT: 'debit',
} as const

export const TransactionStatusLabel = {
  [TransactionStatus.PENDING]: 'Tertunda',
  [TransactionStatus.PAID]: 'Terbayar',
  [TransactionStatus.EXPIRED]: 'Kedaluarsa',
  [TransactionStatus.CANCELLED]: 'Dibatalkan',
  [TransactionStatus.FAILED]: 'Gagal',
}

export const PaymentMethodLabel = {
  [PaymentMethod.CASH]: 'Tunai',
  [PaymentMethod.QRIS]: 'QRIS',
  [PaymentMethod.DEBIT]: 'Debit',
} as const

export type TransactionStatus = (typeof TransactionStatus)[keyof typeof TransactionStatus]
export type PaymentMethod = (typeof PaymentMethod)[keyof typeof PaymentMethod]
