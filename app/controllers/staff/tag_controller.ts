import type { HttpContext } from '@adonisjs/core/http'
import { inject } from '@adonisjs/core'
import OrderService from '#services/order_service'
import OrderTransformer from '#transformers/order_transformer'

@inject()
export default class TagController {
  constructor(protected orderService: OrderService) {}

  /**
   * Renders a printable tag for an order, listing every item in it, so staff
   * can attach it to the batch and tell whose shoes are whose on the rack.
   */
  async show({ params, inertia }: HttpContext) {
    const order = await this.orderService.getOrderByNumber(String(params.number))

    return inertia.render('staff/order/tag', {
      order: OrderTransformer.transform(order).useVariant('toDetail'),
    })
  }
}
