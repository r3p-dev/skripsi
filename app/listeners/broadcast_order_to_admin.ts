import type Order from '#models/order'
import type OrderCreated from '#events/order_created'
import type OrderPaid from '#events/order_paid'
import type OrderPriceCorrected from '#events/order_price_corrected'
import type OrderStatusChanged from '#events/order_status_changed'
import { ADMIN_ORDERS_CHANNEL } from '#services/order_service'
import { OrderStatusLabel, OrderTypeLabel } from '#enums/order_enum'
import transmit from '@adonisjs/transmit/services/main'
import { formatRupiah } from '#utils/currency'

export type AdminOrderEvent = 'order:created' | 'order:updated' | 'order:paid'

export type AdminOrderReason = 'created' | 'status-change' | 'price-correction' | 'payment'

const EVENT_FOR_REASON: Record<AdminOrderReason, AdminOrderEvent> = {
  'created': 'order:created',
  'status-change': 'order:updated',
  'price-correction': 'order:updated',
  'payment': 'order:paid',
}

export default class BroadcastOrderToAdmin {
  onCreated(event: OrderCreated): void {
    this.#announce(event.order, 'created')
  }

  onStatusChanged(event: OrderStatusChanged): void {
    if (event.reason === 'payment') {
      return
    }

    this.#announce(event.order, 'status-change')
  }

  onPriceCorrected(event: OrderPriceCorrected): void {
    this.#announce(event.order, 'price-correction')
  }

  onPaid(event: OrderPaid): void {
    this.#announce(event.order, 'payment')
  }

  #announce(order: Order, reason: AdminOrderReason): void {
    transmit.broadcast(ADMIN_ORDERS_CHANNEL, {
      event: EVENT_FOR_REASON[reason],
      reason,
      orderNumber: order.orderNumber,
      customerName: order.customerName,
      status: order.status,
      statusLabel: OrderStatusLabel[order.status],
      typeLabel: OrderTypeLabel[order.type],
      totalPriceLabel: order.totalPrice === null ? null : formatRupiah(order.totalPrice),
    })
  }
}
