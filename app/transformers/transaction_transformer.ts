import { BaseTransformer } from '@adonisjs/core/transformers'
import type Transaction from '#models/transaction'
import OrderTransformer from '#transformers/order_transformer'
import { DateTime } from 'luxon'
import {
  type PaymentMethod,
  PaymentMethodLabel,
  type TransactionStatus,
  TransactionStatusLabel,
} from '#enums/transaction_enum'

export default class TransactionTransformer extends BaseTransformer<Transaction> {
  toObject() {
    return {
      ...this.pick(this.resource, ['id', 'midtransOrderId', 'midtransTransactionId', 'qrCode']),

      paymentMethod: PaymentMethodLabel[this.resource.paymentMethod as PaymentMethod],
      status: TransactionStatusLabel[this.resource.status as TransactionStatus],
      createdAt: this.resource.createdAt.setLocale('id').toLocaleString(DateTime.DATE_FULL),

      order: OrderTransformer.transform(this.whenLoaded(this.resource.order)),
    }
  }
}
