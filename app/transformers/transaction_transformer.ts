import type Transaction from '#models/transaction'
import { BaseTransformer } from '@adonisjs/core/transformers'

export default class TransactionTransformer extends BaseTransformer<Transaction> {
  toObject() {
    return this.pick(this.resource, [
      'id',
      'type',
      'paymentMethod',
      'midtransOrderId',
      'midtransCode',
      'status',
      'amount',
      'paidAt',
      'expiredAt',
      'createdAt',
    ])
  }
}
