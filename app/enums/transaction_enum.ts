/**
 * Enum representing the different statuses of a transaction and the payment methods available in the application.
 */
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

/**
 * The methods money can arrive by without Midtrans being involved: the two a
 * customer standing at the counter can hand over.
 *
 * QRIS is deliberately absent. A QRIS payment is always a Midtrans charge and
 * always confirmed by Midtrans, so an admin marking one paid by hand would be
 * asserting something only the provider can actually know.
 */
export const MANUAL_PAYMENT_METHODS: string[] = [PaymentMethod.CASH, PaymentMethod.DEBIT]

/**
 * A payment taken in person, as opposed to one charged through Midtrans.
 */
export type ManualPaymentMethod = typeof PaymentMethod.CASH | typeof PaymentMethod.DEBIT

/**
 * Customer-facing labels for transaction statuses and payment methods.
 * These labels are used in the UI to provide a more user-friendly representation of the enum values.
 */
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

/**
 * Type representing the transaction status and payment method.
 */
export type TransactionStatus = (typeof TransactionStatus)[keyof typeof TransactionStatus]
export type PaymentMethod = (typeof PaymentMethod)[keyof typeof PaymentMethod]
