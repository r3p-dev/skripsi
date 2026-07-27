import { core, type MidtransNotification } from '#config/midtrans'
import { OrderStatus, OrderStatusLabel } from '#enums/order_status_enum'
import { PaymentMethod, TransactionStatus, TransactionStatusLabel } from '#enums/transaction_enum'
import type Order from '#models/order'
import Transaction from '#models/transaction'
import transmit from '@adonisjs/transmit/services/main'
import db from '@adonisjs/lucid/services/db'
import { errors as vineErrors } from '@vinejs/vine'

/**
 * Statuses that legitimately need a payment: customers awaiting
 * payment after inspection, and offline orders paid on the spot.
 */
const PAYABLE_STATUSES: string[] = [OrderStatus.AWAITING_PAYMENT, OrderStatus.IN_CLEANING]

/**
 * Handles Midtrans Core API payments for orders awaiting payment.
 */
export default class TransactionService {
  /**
   * Creates a QRIS payment for an order, reusing an existing pending
   * transaction instead of charging Midtrans again if one is in progress.
   */
  async createQrisTransaction(order: Order): Promise<Transaction> {
    if (!PAYABLE_STATUSES.includes(order.status) || !order.totalPrice) {
      throw new vineErrors.E_VALIDATION_ERROR([
        {
          field: 'status',
          message: 'Pesanan ini tidak memerlukan pembayaran saat ini.',
        },
      ])
    }

    const pending = await Transaction.query()
      .where('orderId', order.id)
      .where('status', TransactionStatus.PENDING)
      .first()

    if (pending) {
      return pending
    }

    const midtransOrderId = `${order.orderNumber}-${Date.now()}`

    const response = await core.charge({
      payment_type: 'qris',
      transaction_details: {
        order_id: midtransOrderId,
        gross_amount: order.totalPrice,
      },
      qris: {
        acquirer: 'gopay',
      },
    })

    const qrCode = (response.actions as { name: string; url: string }[] | undefined)?.find(
      (action) => action.name === 'generate-qr-code'
    )?.url

    return Transaction.create({
      orderId: order.id,
      paymentMethod: PaymentMethod.QRIS,
      midtransOrderId,
      midtransTransactionId: response.transaction_id,
      status: TransactionStatus.PENDING,
      qrCode: qrCode ?? null,
    })
  }

  /**
   * Records a payment collected in person (cash or debit) as paid
   * immediately, without going through Midtrans.
   */
  async createManualTransaction(
    order: Order,
    paymentMethod: typeof PaymentMethod.CASH | typeof PaymentMethod.DEBIT
  ): Promise<Transaction> {
    return Transaction.create({
      orderId: order.id,
      paymentMethod,
      midtransOrderId: null,
      midtransTransactionId: null,
      status: TransactionStatus.PAID,
      qrCode: null,
    })
  }

  /**
   * Returns the most recent transaction created for an order, if any.
   */
  async getLatestTransaction(order: Order): Promise<Transaction | null> {
    return Transaction.query().where('orderId', order.id).orderBy('createdAt', 'desc').first()
  }

  /**
   * Applies a Midtrans notification payload to the matching transaction,
   * advances the order once payment is confirmed, and broadcasts the
   * update over Transmit so an open payment page can react live.
   *
   * Assumes the caller has already verified the notification signature.
   */
  async handleNotification(payload: MidtransNotification): Promise<void> {
    const transaction = await Transaction.query()
      .where('midtransOrderId', payload.order_id)
      .preload('order')
      .first()

    if (!transaction) {
      return
    }

    const status = this.resolveStatus(payload)

    await db.transaction(async (trx) => {
      await transaction
        .merge({
          status,
          midtransTransactionId: payload.transaction_id,
        })
        .useTransaction(trx)
        .save()

      if (
        status === TransactionStatus.PAID &&
        transaction.order.status === OrderStatus.AWAITING_PAYMENT
      ) {
        await transaction.order
          .merge({ status: OrderStatus.IN_CLEANING })
          .useTransaction(trx)
          .save()
      }
    })

    transmit.broadcast(`orders/${transaction.order.orderNumber}`, {
      transactionStatusLabel: TransactionStatusLabel[status],
      orderStatusLabel: OrderStatusLabel[transaction.order.status as OrderStatus],
    })
  }

  /**
   * Maps Midtrans' transaction/fraud status combination to our own
   * transaction status enum.
   */
  private resolveStatus(payload: MidtransNotification): TransactionStatus {
    const { transaction_status: transactionStatus, fraud_status: fraudStatus } = payload

    if (transactionStatus === 'capture') {
      return fraudStatus === 'accept' ? TransactionStatus.PAID : TransactionStatus.FAILED
    }
    if (transactionStatus === 'settlement') {
      return TransactionStatus.PAID
    }
    if (transactionStatus === 'pending') {
      return TransactionStatus.PENDING
    }
    if (transactionStatus === 'expire') {
      return TransactionStatus.EXPIRED
    }

    return TransactionStatus.FAILED
  }
}
