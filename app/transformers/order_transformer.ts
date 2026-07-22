import type Order from '#models/order'
import { type OrderStatus, OrderStatusLabel } from '#enums/order_status_enum'
import AddressTransformer from '#transformers/address_transformer'
import OrderActionTransformer from '#transformers/order_action_transformer'
import OrderItemTransformer from '#transformers/order_item_transformer'
import TransactionTransformer from '#transformers/transaction_transformer'
import UserTransformer from '#transformers/user_transformer'
import { BaseTransformer } from '@adonisjs/core/transformers'
import { DateTime } from 'luxon'
import { formatRupiah } from '#utils/currency'

/**
 * Serialize order models and their loaded relations for API responses.
 */
export default class OrderTransformer extends BaseTransformer<Order> {
  /**
   * Convert an order model into the public response payload.
   */
  toObject() {
    return {
      ...this.pick(this.resource, ['id', 'orderNumber', 'customerName', 'customerPhone']),

      totalPrice: this.resource.totalPrice ? formatRupiah(this.resource.totalPrice) : null,
      status: OrderStatusLabel[this.resource.status as OrderStatus],
      pickupDate: this.resource.pickupDate?.setLocale('id').toLocaleString(DateTime.DATE_FULL),
      createdAt: this.resource.createdAt.setLocale('id').toLocaleString(DateTime.DATE_FULL),

      user: UserTransformer.transform(this.whenLoaded(this.resource.user)),
      address: AddressTransformer.transform(this.whenLoaded(this.resource.address)),
      items: OrderItemTransformer.transform(this.whenLoaded(this.resource.items)),
      actions: OrderActionTransformer.transform(this.whenLoaded(this.resource.actions)),
      transactions: TransactionTransformer.transform(this.whenLoaded(this.resource.transactions)),
    }
  }
}
