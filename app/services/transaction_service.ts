import Order from '#models/order'
import Transaction from '#models/transaction'
import OrderPaid from '#events/order_paid'
import OrderService from '#services/order_service'
import { dispatch } from '#utils/events'
import { type MidtransNotification, core } from '#config/midtrans'
import { OrderStatus } from '#enums/order_enum'
import { PaymentMethod, TransactionStatus } from '#enums/transaction_enum'
import {
  midtransChargeKey,
  midtransChargeLimiter,
  throwMidtransChargeLimitExceeded,
} from '#start/limiter'
import { errors as vineErrors } from '@vinejs/vine'
import { errors as limiterErrors } from '@adonisjs/limiter'
import { inject } from '@adonisjs/core'
import logger from '@adonisjs/core/services/logger'
import db from '@adonisjs/lucid/services/db'
import transmit from '@adonisjs/transmit/services/main'

const QR_LIFETIME_MINUTES = 15

const NOTIFICATION_STATUSES: Record<string, TransactionStatus> = {
  capture: TransactionStatus.PAID,
  settlement: TransactionStatus.PAID,
  pending: TransactionStatus.PENDING,
  deny: TransactionStatus.FAILED,
  cancel: TransactionStatus.CANCELLED,
  expire: TransactionStatus.EXPIRED,
  failure: TransactionStatus.FAILED,
}

type ChargeResult = {
  midtransOrderId: string
  midtransTransactionId: string | null
  qrCode: string | null
}

type MidtransChargeResponse = {
  order_id?: string
  transaction_id?: string
  actions?: { name: string; url: string }[]
}

@inject()
export default class TransactionService {
  constructor(protected orderService: OrderService) {}

  async getLatestTransaction(order: Order): Promise<Transaction | null> {
    return Transaction.query()
      .where('order_id', order.id)
      .orderByRaw(`case when status = ? then 0 else 1 end`, [TransactionStatus.PENDING])
      .orderBy('created_at', 'desc')
      .first()
  }

  async getPendingTransaction(order: Order): Promise<Transaction | null> {
    return Transaction.query()
      .where('order_id', order.id)
      .andWhere('status', TransactionStatus.PENDING)
      .first()
  }

  async startPayment(order: Order): Promise<Transaction> {
    this.#assertPayable(order)

    const pending = await this.getPendingTransaction(order)

    if (pending && !this.#isStale(pending)) {
      return pending
    }

    const charge = await this.#charge(order)

    return db.transaction(async (trx) => {
      if (pending) {
        await pending.merge({ status: TransactionStatus.EXPIRED }).useTransaction(trx).save()
      }

      return Transaction.create(
        {
          orderId: order.id,
          paymentMethod: PaymentMethod.QRIS,
          status: TransactionStatus.PENDING,
          midtransOrderId: charge.midtransOrderId,
          midtransTransactionId: charge.midtransTransactionId,
          qrCode: charge.qrCode,
          cashReceived: null,
        },
        { client: trx }
      )
    })
  }

  async confirmManualPayment(
    order: Order,
    paymentMethod: PaymentMethod,
    note: string
  ): Promise<Transaction> {
    this.#assertPayable(order)

    const pending = await this.getPendingTransaction(order)

    const transaction = await db.transaction(async (trx) => {
      if (pending) {
        pending.merge({ status: TransactionStatus.EXPIRED })
        await pending.useTransaction(trx).save()
      }

      const settled = await Transaction.create(
        {
          orderId: order.id,
          paymentMethod,
          status: TransactionStatus.PAID,
          midtransOrderId: null,
          midtransTransactionId: null,
          qrCode: null,
          cashReceived: null,
        },
        { client: trx }
      )

      await this.orderService.transitionTo(order, OrderStatus.IN_CLEANING, trx, 'payment')

      return settled
    })

    logger.info({ order: order.orderNumber, note }, 'Payment confirmed manually')

    this.broadcast(order, transaction)

    return transaction
  }

  async handleNotification(payload: MidtransNotification): Promise<void> {
    const transaction = await Transaction.query()
      .where('midtrans_order_id', payload.order_id)
      .preload('order')
      .first()

    if (!transaction) {
      logger.warn({ orderId: payload.order_id }, 'Midtrans notification for an unknown transaction')

      return
    }

    const status = this.#resolveStatus(payload)

    if (transaction.status === status) {
      return
    }

    if (transaction.status === TransactionStatus.PAID) {
      return
    }

    transaction.merge({
      status,
      midtransTransactionId: payload.transaction_id ?? transaction.midtransTransactionId,
    })

    await transaction.save()

    if (status === TransactionStatus.PAID) {
      await this.#settle(transaction.order)
    }

    this.broadcast(transaction.order, transaction)
  }

  broadcast(order: Order, transaction: Transaction): void {
    transmit.broadcast(`orders/${order.orderNumber}`, {
      transactionStatus: transaction.status,
      orderStatus: order.status,
    })
  }

  async #settle(order: Order): Promise<void> {
    if (order.status !== OrderStatus.AWAITING_PAYMENT) {
      await dispatch(OrderPaid, new OrderPaid(order))

      return
    }

    await this.orderService.transitionTo(order, OrderStatus.IN_CLEANING, undefined, 'payment')
  }

  #assertPayable(order: Order): void {
    if (this.orderService.canPay(order)) {
      return
    }

    throw new vineErrors.E_VALIDATION_ERROR([
      {
        field: 'form',
        message:
          order.status === OrderStatus.AWAITING_PAYMENT
            ? 'Tagihan pesanan ini belum ditentukan petugas.'
            : 'Pesanan ini belum menunggu pembayaran.',
      },
    ])
  }

  #isStale(transaction: Transaction): boolean {
    if (!transaction.qrCode) {
      return true
    }

    return transaction.createdAt.diffNow('minutes').minutes < -QR_LIFETIME_MINUTES
  }

  #resolveStatus(payload: MidtransNotification): TransactionStatus {
    const status = NOTIFICATION_STATUSES[payload.transaction_status] ?? TransactionStatus.FAILED

    if (status === TransactionStatus.PAID && payload.fraud_status === 'challenge') {
      return TransactionStatus.PENDING
    }

    return status
  }

  /**
   * Throttles the charge itself, not the route that asked for it, so no entry
   * path can hammer Midtrans on behalf of one order.
   */
  async #assertChargeAllowed(order: Order): Promise<void> {
    try {
      await midtransChargeLimiter.consume(midtransChargeKey(order.id))
    } catch (error) {
      if (!(error instanceof limiterErrors.E_TOO_MANY_REQUESTS)) {
        throw error
      }

      logger.warn({ order: order.orderNumber }, 'Midtrans charge attempt throttled')

      throwMidtransChargeLimitExceeded()
    }
  }

  async #nextMidtransOrderId(order: Order): Promise<string> {
    const [row] = await Transaction.query().where('order_id', order.id).count('* as total')

    return `${order.orderNumber}-${Number(row.$extras.total) + 1}`
  }

  async #charge(order: Order): Promise<ChargeResult> {
    const midtransOrderId = await this.#nextMidtransOrderId(order)

    await this.#assertChargeAllowed(order)

    let response: MidtransChargeResponse

    try {
      response = (await core.charge({
        payment_type: 'qris',
        transaction_details: {
          order_id: midtransOrderId,
          gross_amount: Number(order.totalPrice),
        },
        qris: { acquirer: 'gopay' },
        customer_details: {
          first_name: order.customerName,
          phone: order.customerPhone,
        },
      })) as MidtransChargeResponse
    } catch (error) {
      logger.error({ err: error, order: order.orderNumber }, 'Midtrans charge failed')

      throw new vineErrors.E_VALIDATION_ERROR([
        {
          field: 'form',
          message: 'Layanan pembayaran sedang tidak tersedia. Silakan coba lagi.',
        },
      ])
    }

    const qrCode = response.actions?.find((action) => action.name === 'generate-qr-code')?.url

    return {
      midtransOrderId: response.order_id ?? midtransOrderId,
      midtransTransactionId: response.transaction_id ?? null,
      qrCode: qrCode ?? null,
    }
  }
}
