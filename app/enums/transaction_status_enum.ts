/**
 * Enum representing the status of a transaction.
 */
export const TransactionStatus = {
  PENDING: 'pending',
  PAID: 'paid',
  EXPIRED: 'expired',
  CANCELLED: 'cancelled',
  FAILED: 'failed',
} as const

/**
 * Type representing the status of a transaction.
 */
export type TransactionStatus = (typeof TransactionStatus)[keyof typeof TransactionStatus]

/**
 * Customer-facing labels for transaction statuses.
 */
export const TransactionStatusLabel = {
  [TransactionStatus.PENDING]: 'Tertunda',
  [TransactionStatus.PAID]: 'Terbayar',
  [TransactionStatus.EXPIRED]: 'Kedaluarsa',
  [TransactionStatus.CANCELLED]: 'Dibatalkan',
  [TransactionStatus.FAILED]: 'Gagal',
}
