import midtrans, { type MidtransQrisResponse } from '#config/midtrans'
import type Order from '#models/order'
import { PaymentMethod, TransactionStatus, TransactionType } from '#models/transaction'
import { paymentLimiter } from '#start/limiter'
import TransactionTransformer from '#transformers/transaction_transformer'
import type { HttpContext } from '@adonisjs/core/http'
import { DateTime } from 'luxon'

export default class DownPaymentController {
  async store({ request, params, response, session, auth, logger }: HttpContext) {
    const user = auth.getUserOrFail()

    const order = await user
      .related('orders')
      .query()
      .preload('address')
      .where('number', params.number)
      .firstOrFail()
    const transaction = await order
      .related('transactions')
      .query()
      .where('type', TransactionType.DOWN_PAYMENT)
      .orderBy('created_at', 'desc')
      .firstOrFail()

    const isExpired = DateTime.now() > transaction.expiredAt
    const isPending = transaction.status === TransactionStatus.PENDING

    if (isPending && !isExpired) {
      session.flash('error', 'Masih ada pembayaran yang sedang aktif untuk pesanan ini')
      return response.redirect().toRoute('down_payment.show', { number: order.number })
    }

    if (isPending && isExpired) {
      await transaction.merge({ status: TransactionStatus.EXPIRED }).save()
      session.flash('error', 'Pembayaran sebelumnya telah kadaluarsa, silakan buat pembayaran baru')

      return response.redirect().toRoute('down_payment.show', { number: order.number })
    }

    const amount = this.calculateDownPayment(order)
    const key = `payment_DP_${request.ip()}_${order.number}`

    const [error] = await paymentLimiter.penalize(key, async () => {
      const orderId = `DP_${order.number}_${DateTime.now().toFormat('yyyyMMddHHmmss')}`

      const result: MidtransQrisResponse = await midtrans.charge({
        payment_type: 'qris',
        qris: { acquirer: 'gopay' },
        transaction_details: {
          order_id: orderId,
          gross_amount: amount,
        },
        customer_details: {
          name: order.address.name,
          phone: order.address.phone,
          address: order.address.street,
        },
        item_details: {
          id: order.id,
          name: `Order ${order.number}`,
          price: amount,
          quantity: 1,
        },
      })

      const qrCodeAction = result.actions.find((a) => a.name === 'generate-qr-code-v2')
      const midtransCode = qrCodeAction?.url.split('/')[6]

      if (!midtransCode) {
        throw new Error('Gagal mendapatkan QR Code dari Midtrans')
      }

      await order.related('transactions').create({
        type: TransactionType.DOWN_PAYMENT,
        paymentMethod: PaymentMethod.QRIS,
        status: TransactionStatus.PENDING,
        amount,
        midtransOrderId: result.transaction_id,
        midtransCode,
        expiredAt: DateTime.now().plus({ minutes: 15 }),
      })
    })

    if (error) {
      logger.warn('Too many down payment attempts detected.')
      session.flash(
        'error',
        `Terlalu banyak percobaan pembayaran. Silakan coba lagi setelah ${error.response.availableIn} detik.`
      )
      return response.redirect().back()
    }

    return response.redirect().toRoute('down_payment.show', { number: order.number })
  }

  async show({ inertia, auth, params, session, request, response }: HttpContext) {
    const user = auth.getUserOrFail()
    if (!request.hasValidSignature()) {
      return inertia.render('errors/invalid-token', {})
    }

    const order = await user.related('orders').query().where('number', params.number).firstOrFail()
    const transaction = await order
      .related('transactions')
      .query()
      .where('type', TransactionType.DOWN_PAYMENT)
      .andWhere('status', TransactionStatus.PENDING)
      .orderBy('created_at', 'desc')
      .firstOrFail()

    const isExpired = DateTime.now() > transaction.expiredAt
    const isActive = DateTime.now() < transaction.expiredAt

    if (!isActive) {
      session.flash(
        'error',
        isExpired ? 'Transaksi pembayaran telah kadaluarsa' : 'Transaksi tidak aktif'
      )
      return response.redirect().toRoute('order.show', { number: params.number })
    }

    return inertia.render('transaction/down-payment', {
      transaction: TransactionTransformer.transform(transaction),
    })
  }

  private calculateDownPayment(order: Order) {
    const radius = order.address.radius
    const baseAmount = 15000

    if (radius <= 5000) return baseAmount

    const extraBlocks = Math.ceil((radius - 5000) / 5000)

    return baseAmount + extraBlocks * 5000
  }
}
