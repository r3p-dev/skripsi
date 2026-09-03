import type Order from '#models/order'
import type { OrderStatus } from '#enums/order_enum'
import type { TransitionReason } from '#services/order_service'

export default class OrderStatusChanged {
  constructor(
    readonly order: Order,
    readonly from: OrderStatus,
    readonly to: OrderStatus,
    readonly reason: TransitionReason
  ) {}
}
