import { ActionName } from '#enums/order_action_enum'
import { OrderStatus } from '#enums/order_status_enum'
import { TransactionStatus } from '#enums/transaction_enum'
import Order from '#models/order'
import OrderAction from '#models/order_action'
import Transaction from '#models/transaction'
import type User from '#models/user'
import BroadcastService from '#services/broadcast_service'
import { EXPORT_ROW_LIMIT } from '#services/excel_service'
import type { ReconciliationData } from '#validators/reconciliation_validator'
import type { Filters } from '#validators/shared'
import { inject } from '@adonisjs/core'
import db from '@adonisjs/lucid/services/db'
import type { ModelPaginatorContract } from '@adonisjs/lucid/types/model'
import { errors as vineErrors } from '@vinejs/vine'

/**
 * Resolves orders that are stuck waiting for a payment confirmation that
 * never arrived.
 *
 * Midtrans confirms a payment by calling the webhook. If that call is lost the
 * order sits in `AWAITING_PAYMENT` forever: the customer cannot mark their own
 * order paid and staff have no tool for it either. This is the only way out,
 * and it is admin-only because overriding a payment state should be rare,
 * deliberate, and attributable to a person.
 */
@inject()
export default class ReconciliationService {
  constructor(private broadcastService: BroadcastService) {}

  /**
   * The orders stuck awaiting payment, oldest first — the longer one has sat
   * there, the more likely it is a lost callback rather than a customer who
   * simply has not paid yet.
   */
  async getStuckOrders(filters: Filters): Promise<ModelPaginatorContract<Order>> {
    return this.stuckOrdersQuery(filters).paginate(filters.page, 10)
  }

  /**
   * The same backlog, unpaginated, for the spreadsheet export — the list an
   * admin takes to the bank statement to work out which payments really did
   * arrive.
   */
  async getStuckOrdersForExport(filters: Filters): Promise<Order[]> {
    return this.stuckOrdersQuery(filters).limit(EXPORT_ROW_LIMIT)
  }

  private stuckOrdersQuery(filters: Filters) {
    const searchTerm = `${filters.search}%`

    return Order.query()
      .where('status', OrderStatus.AWAITING_PAYMENT)
      .if(filters.search, (query) => {
        query.where((matches) => {
          matches.whereILike('order_number', searchTerm).orWhereILike('customer_name', searchTerm)
        })
      })
      .preload('transactions', (transactionsQuery) => {
        transactionsQuery.orderBy('created_at', 'desc')
      })
      .preload('user')
      .orderBy('created_at', 'asc')
  }

  /**
   * Confirms payment on an order by hand and lets it continue into cleaning.
   *
   * Settles the transaction that is already pending where there is one, so the
   * Midtrans charge the customer actually scanned is the row that ends up
   * marked paid rather than a second row appearing beside it. Orders that were
   * never charged get a fresh transaction for the method the money arrived by.
   *
   * The `payment_override` action is the audit trail: it names the admin, the
   * moment, and the reason they gave.
   */
  async confirmPayment(admin: User, orderNumber: string, data: ReconciliationData): Promise<Order> {
    const order = await Order.query()
      .where('order_number', orderNumber)
      .preload('transactions')
      .firstOrFail()

    if (order.status !== OrderStatus.AWAITING_PAYMENT) {
      throw new vineErrors.E_VALIDATION_ERROR([
        {
          field: 'status',
          message: 'Pesanan ini tidak sedang menunggu pelunasan.',
        },
      ])
    }

    const pending = order.transactions.find(
      (transaction) => transaction.status === TransactionStatus.PENDING
    )

    await db.transaction(async (trx) => {
      if (pending) {
        await pending
          .merge({ status: TransactionStatus.PAID, paymentMethod: data.paymentMethod })
          .useTransaction(trx)
          .save()
      } else {
        await Transaction.create(
          {
            orderId: order.id,
            paymentMethod: data.paymentMethod,
            midtransOrderId: null,
            midtransTransactionId: null,
            status: TransactionStatus.PAID,
            qrCode: null,
            cashReceived: null,
          },
          { client: trx }
        )
      }

      await OrderAction.create(
        {
          orderId: order.id,
          staffId: admin.id,
          name: ActionName.PAYMENT_OVERRIDE,
          photoPath: null,
          note: data.note,
        },
        { client: trx }
      )

      await order.merge({ status: OrderStatus.IN_CLEANING }).useTransaction(trx).save()
    })

    /**
     * The same broadcast the webhook sends, so a customer sitting on the
     * payment page watching the QR code sees the order move on rather than
     * waiting on a code that will never be scanned.
     */
    this.broadcastService.orderChanged(order, TransactionStatus.PAID)
    this.broadcastService.orderPaid(order)

    return order
  }
}
