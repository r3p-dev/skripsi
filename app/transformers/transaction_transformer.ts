import { BaseTransformer } from '@adonisjs/core/transformers'
import type Transaction from '#models/transaction'
import { type TransactionStatus, TransactionStatusLabel } from '#enums/transaction_status_enum'
import OrderTransformer from '#transformers/order_transformer'
import { DateTime } from 'luxon'

/**
 * Serialize transaction models and their loaded order relation for API responses.
 */
export default class TransactionTransformer extends BaseTransformer<Transaction> {
  /**
   * Convert a transaction model into the public response payload.
   */
  toObject() {
    return {
      ...this.pick(this.resource, [
        'id',
        'midtransOrderId',
        'midtransTransactionId',
        'snapToken',
        'snapRedirectUrl',
      ]),

      status: TransactionStatusLabel[this.resource.status as TransactionStatus],
      createdAt: this.resource.createdAt.setLocale('id').toLocaleString(DateTime.DATE_FULL),

      order: OrderTransformer.transform(this.whenLoaded(this.resource.order)),
    }
  }
}
