import type Transaction from '#models/transaction'
import { BaseTransformer } from '@adonisjs/core/transformers'

export default class TransactionTransformer extends BaseTransformer<Transaction> {
  toObject() {
    return {
      ...this.pick(this.resource, ['id', 'midtransOrderId', 'midtransTransactionId', 'qrCode']),

      paymentMethod: this.resource.paymentMethod,
      status: this.resource.status,
      /**
       * What the customer handed over at the counter, for the cash payments
       * that have change to give back. Everything else settles for the exact
       * amount and leaves this null.
       */
      cashReceived: this.resource.cashReceived === null ? null : Number(this.resource.cashReceived),
      createdAt: this.resource.createdAt.toISO(),
    }
  }
}
