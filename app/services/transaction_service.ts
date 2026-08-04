import { core, type MidtransNotification } from '#config/midtrans'
import { OrderStatus } from '#enums/order_status_enum'
import { type ManualPaymentMethod, PaymentMethod, TransactionStatus } from '#enums/transaction_enum'
import type Order from '#models/order'
import Transaction from '#models/transaction'
import BroadcastService from '#services/broadcast_service'
import { midtransChargeLimiter } from '#start/limiter'
import { inject } from '@adonisjs/core'
import db from '@adonisjs/lucid/services/db'
import { errors as vineErrors } from '@vinejs/vine'

/**
 * Statuses that legitimately need a payment: customers awaiting
 * payment after inspection, and counter orders paid on the spot.
 */
const PAYABLE_STATUSES: string[] = [OrderStatus.AWAITING_PAYMENT, OrderStatus.IN_CLEANING]

/**
 * Handles Midtrans Core API payments for orders awaiting payment.
 */
@inject()
export default class TransactionService {
  constructor(private broadcastService: BroadcastService) {}

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

    /**
     * Only a real charge is metered — reusing a pending transaction above
     * never reaches Midtrans, so it must not count against the order's budget.
     */
    try {
      await midtransChargeLimiter.consume(`midtrans_charge:${order.id}`)
    } catch {
      throw new vineErrors.E_VALIDATION_ERROR([
        {
          field: 'status',
          message: 'Terlalu banyak percobaan pembayaran. Silakan coba lagi nanti.',
        },
      ])
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
   *
   * Cash carries what the customer actually handed over, so the change given
   * back is part of the record rather than a sum somebody did in their head
   * and nobody can check afterwards.
   */
  async createManualTransaction(
    order: Order,
    paymentMethod: ManualPaymentMethod,
    cashReceived: number | null = null
  ): Promise<Transaction> {
    const transaction = await Transaction.create({
      orderId: order.id,
      paymentMethod,
      midtransOrderId: null,
      midtransTransactionId: null,
      status: TransactionStatus.PAID,
      qrCode: null,
      cashReceived: paymentMethod === PaymentMethod.CASH ? cashReceived : null,
    })

    this.broadcastService.orderPaid(order)

    return transaction
  }

  /**
   * What the customer gets back, for a payment they overpaid in cash.
   *
   * Kept next to the payment rather than left to the counter screen so the
   * receipt, the confirmation and any later look at the order all quote the
   * same number.
   */
  changeFor(order: Order, transaction: Transaction): number {
    if (transaction.paymentMethod !== PaymentMethod.CASH || transaction.cashReceived === null) {
      return 0
    }

    return Math.max(0, Number(transaction.cashReceived) - Number(order.totalPrice ?? 0))
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
   * What a confirmed payment does to the order depends on where the order came
   * from, and the two cases are genuinely different rather than one being a
   * special case of the other:
   *
   * - A booked order was quoted at inspection and has been sitting in
   *   `AWAITING_PAYMENT` ever since. Payment is the thing that releases it
   *   into cleaning, so it moves.
   * - A counter order was paid for as it was written up and went straight into
   *   cleaning. By the time a QRIS scan confirms, the shoes are already being
   *   washed — possibly already washed. Advancing it would drag a finished
   *   order backwards, so the payment is recorded and the status left alone.
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
    const order = transaction.order

    await db.transaction(async (trx) => {
      await transaction
        .merge({
          status,
          midtransTransactionId: payload.transaction_id,
        })
        .useTransaction(trx)
        .save()

      if (status === TransactionStatus.PAID && order.status === OrderStatus.AWAITING_PAYMENT) {
        await order.merge({ status: OrderStatus.IN_CLEANING }).useTransaction(trx).save()
      }
    })

    this.broadcastService.orderChanged(order, status)

    if (status === TransactionStatus.PAID) {
      this.broadcastService.orderPaid(order)
    }
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
