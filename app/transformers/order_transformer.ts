import type Order from '#models/order'
import AddressTransformer from '#transformers/address_transformer'
import DiscountTransformer from '#transformers/discount_transformer'
import OrderActionTransformer from '#transformers/order_action_transformer'
import OrderItemTransformer from '#transformers/order_item_transformer'
import ReviewTransformer from '#transformers/review_transformer'
import ShoeTransformer from '#transformers/shoe_transformer'
import TransactionTransformer from '#transformers/transaction_transformer'
import UserTransformer from '#transformers/user_transformer'
import { BaseTransformer } from '@adonisjs/core/transformers'

export default class OrderTransformer extends BaseTransformer<Order> {
  toObject() {
    return {
      ...this.pick(this.resource, [
        'id',
        'number',
        'date',
        'type',
        'status',
        'paymentStatus',
        'subtotalPrice',
        'discountAmount',
        'totalPrice',
        'pickupPhotoPath',
        'inspectionPhotoPath',
        'deliveryPhotoPath',
        'pickupAt',
        'inspectionAt',
        'deliveryAt',
        'createdAt',
      ]),
      user: UserTransformer.transform(this.whenLoaded(this.resource.user)),
      address: AddressTransformer.transform(this.whenLoaded(this.resource.address)),
      discount: DiscountTransformer.transform(this.whenLoaded(this.resource.discount)),
      items: OrderItemTransformer.transform(this.whenLoaded(this.resource.items)),
      actions: OrderActionTransformer.transform(this.whenLoaded(this.resource.actions)),
      review: ReviewTransformer.transform(this.whenLoaded(this.resource.review)),
      shoes: ShoeTransformer.transform(this.whenLoaded(this.resource.shoes)),
      transactions: TransactionTransformer.transform(this.whenLoaded(this.resource.transactions)),
      counts: {
        all: Number(this.resource.$extras?.all ?? 0),
        pickup: Number(this.resource.$extras?.pickup ?? 0),
        inspection: Number(this.resource.$extras?.inspection ?? 0),
        delivery: Number(this.resource.$extras?.delivery ?? 0),
      },
    }
  }
}
