import type { HttpContext } from '@adonisjs/core/http'
import { inject } from '@adonisjs/core'
import OrderService from '#services/order_service'
import ServiceTransformer from '#transformers/service_transformer'

@inject()
export default class HomeController {
  constructor(protected orderService: OrderService) {}

  async index({ inertia }: HttpContext) {
    const services = await this.orderService.getAvailableServices()

    return inertia.render('home', {
      services: ServiceTransformer.transform(services),
    })
  }
}
