import Transaction from '#models/transaction'
import factory from '@adonisjs/lucid/factories'
import { OrderFactory } from '#database/factories/order_factory'
import { PaymentMethod, TransactionStatus } from '#enums/transaction_enum'
import { nextSequence } from '#database/factories/support'

export const TransactionFactory = factory
  .define(Transaction, () => {
    const sequence = nextSequence()

    return {
      paymentMethod: PaymentMethod.QRIS,
      status: TransactionStatus.PENDING,
      midtransOrderId: `ORDUJI-${sequence}`,
      midtransTransactionId: `mt-${sequence}`,
      qrCode: `https://api.sandbox.midtrans.com/v2/qris/${sequence}/qr-code`,
      cashReceived: null,
    }
  })
  /**
   * `transactions_order_id_pending_unique` allows a single pending row per
   * order, so extra attempts on the same order need one of the closed states.
   */
  .state('paid', (transaction) => {
    transaction.status = TransactionStatus.PAID
  })
  .state('expired', (transaction) => {
    transaction.status = TransactionStatus.EXPIRED
  })
  .state('cancelled', (transaction) => {
    transaction.status = TransactionStatus.CANCELLED
  })
  .state('failed', (transaction) => {
    transaction.status = TransactionStatus.FAILED
  })
  .state('cash', (transaction) => {
    transaction.merge({ paymentMethod: PaymentMethod.CASH, qrCode: null })
  })
  .relation('order', () => OrderFactory)
  .build()
