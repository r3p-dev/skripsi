import { BaseTransformer } from '@adonisjs/core/transformers'
import type { RouteItem } from '#services/route_service'
import { OrderStatus, OrderStatusLabel } from '#enums/order_status_enum'
import { DateTime } from 'luxon'

export default class RouteItemTransformer extends BaseTransformer<RouteItem> {
  toObject() {
    return {
      ...this.pick(this.resource, ['id', 'orderNumber', 'distanceKm', 'address']),

      type: this.resource.status === OrderStatus.IN_DELIVERY ? 'delivery' : 'pickup',
      status: OrderStatusLabel[this.resource.status],
      pickupDate:
        this.resource.pickupDate?.setLocale('id').toLocaleString(DateTime.DATE_FULL) ?? null,
    }
  }
}
