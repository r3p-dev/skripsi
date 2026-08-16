import AnalyticsService from '#services/analytics_service'
import OrderTransformer from '#transformers/order_transformer'
import type { HttpContext } from '@adonisjs/core/http'
import { inject } from '@adonisjs/core'

@inject()
export default class DashboardController {
  constructor(protected analyticsService: AnalyticsService) {}

  async index({ inertia }: HttpContext) {
    const { recentOrders, ...rest } = await this.analyticsService.dashboard()

    return inertia.render('admin/index', {
      ...rest,
      recentOrders: OrderTransformer.transform(recentOrders),
    })
  }
}
