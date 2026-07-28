import type { HttpContext } from '@adonisjs/core/http'
import { inject } from '@adonisjs/core'
import OrderService from '#services/order_service'
import ServiceTransformer from '#transformers/service_transformer'

@inject()
export default class HomeController {
  constructor(protected orderService: OrderService) {}

  /**
   * The public landing page. Its service carousel reads the same catalogue the
   * shop actually charges from, so marketing prices can never drift from the
   * ones staff apply at inspection.
   */
  async index({ inertia }: HttpContext) {
    const services = await this.orderService.getAvailableServices()

    return inertia.render('home', {
      services: ServiceTransformer.transform(services),
    })
  }
}
