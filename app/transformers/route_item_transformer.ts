import { BaseTransformer } from '@adonisjs/core/transformers'
import type { RouteItem } from '#services/route_service'
import { OrderStatus } from '#enums/order_status_enum'

export default class RouteItemTransformer extends BaseTransformer<RouteItem> {
  /**
   * A stop on the route, as the task board sees it.
   *
   * The order number, what kind of stop it is, and how far away it is. The
   * address the route was actually planned from is not sent: the board is
   * visible to every staff member on shift whether or not they take the job,
   * and a customer's name, phone number and front door are not a browsing
   * list. They arrive with the task once somebody claims it, at which point
   * the claim is on the record under their name.
   */
  toObject() {
    return {
      ...this.pick(this.resource, ['id', 'orderNumber', 'distanceKm']),

      type: this.resource.status === OrderStatus.IN_DELIVERY ? 'delivery' : 'pickup',
      status: this.resource.status,
      pickupDate: this.resource.pickupDate?.toISODate() ?? null,
    }
  }
}
