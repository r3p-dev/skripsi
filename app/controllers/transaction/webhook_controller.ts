import type { MidtransNotification } from '#config/midtrans'
import { OrderStatus, PaymentStatus } from '#models/order'
import Transaction, { TransactionStatus, TransactionType } from '#models/transaction'
import env from '#start/env'
import type { HttpContext } from '@adonisjs/core/http'
import { DateTime } from 'luxon'
import { createHash } from 'node:crypto'

export default class WebhookController {
  async handle({ request, response, session, logger }: HttpContext) {
    const notification = request.body() as MidtransNotification
    const { transaction_status: transactionStatus, settlement_time: settlementTime } = notification

    if (!this.verifySignature(notification)) {
      logger.warn('Invalid Midtrans signature for order ' + notification.order_id)
      session.flash('error', 'Verifikasi signature gagal. Notifikasi tidak valid.')
      return response.redirect().back()
    }

    const transaction = await Transaction.query()
      .where('midtrans_order_id', notification.order_id)
      .preload('order')
      .firstOrFail()

    if (transactionStatus === 'settlement') {
      transaction.status = TransactionStatus.PAID
      transaction.paidAt = DateTime.fromSQL(settlementTime)
    } else if (transactionStatus === 'deny' || transactionStatus === 'failure') {
      transaction.status = TransactionStatus.FAILED
    } else if (transactionStatus === 'cancel') {
      transaction.status = TransactionStatus.CANCELLED
    } else if (transactionStatus === 'expire') {
      transaction.status = TransactionStatus.EXPIRED
    }

    await transaction.save()

    if (transaction.status === TransactionStatus.PAID) {
      const order = transaction.order

      if (TransactionType.DOWN_PAYMENT) {
        order.paymentStatus = PaymentStatus.PARTIALLY_PAID
        order.status = OrderStatus.IN_PICKUP
      } else if (transaction.type === TransactionType.FULL_PAYMENT) {
        order.paymentStatus = PaymentStatus.PAID
        order.status = OrderStatus.IN_CLEANING
      }

      await order.save()
    }

    return response.redirect().toRoute('order.show', { number: transaction.order.number })
  }

  private verifySignature(notification: MidtransNotification) {
    const {
      order_id: orderId,
      status_code: statusCode,
      gross_amount: grossAmount,
      signature_key: signatureKey,
    } = notification

    const serverKey = env.get('MIDTRANS_SERVER_KEY')
    const hashString = orderId + statusCode + grossAmount + serverKey
    const calculatedSignature = createHash('sha512').update(hashString).digest('hex')

    return calculatedSignature === signatureKey
  }
}
