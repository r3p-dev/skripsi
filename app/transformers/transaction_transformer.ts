import type Transaction from '#models/transaction'
import { BaseTransformer } from '@adonisjs/core/transformers'
import {
  PaymentMethodLabel,
  TransactionStatus,
  TransactionStatusLabel,
} from '#enums/transaction_enum'
import { formatRupiah } from '#utils/currency'
import { DateTime } from 'luxon'

export default class TransactionTransformer extends BaseTransformer<Transaction> {
  toObject() {
    return {
      ...this.pick(this.resource, ['id', 'qrCode']),

      status: this.resource.status,
      statusLabel: TransactionStatusLabel[this.resource.status],
      isPaid: this.resource.status === TransactionStatus.PAID,
      isPending: this.resource.status === TransactionStatus.PENDING,

      paymentMethod: this.resource.paymentMethod,
      paymentMethodLabel: PaymentMethodLabel[this.resource.paymentMethod],

      cashReceived: this.resource.cashReceived === null ? null : Number(this.resource.cashReceived),
      cashReceivedLabel: formatRupiah(this.resource.cashReceived),

      createdAt: this.resource.createdAt.setLocale('id').toLocaleString(DateTime.DATE_FULL),
    }
  }
}
