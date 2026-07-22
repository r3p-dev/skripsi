import OrderService from '#services/order_service'
import { inject } from '@adonisjs/core'
import { type PageObject } from '@adonisjs/inertia/types'
import type { HttpContext } from '@adonisjs/core/http'
import { DateTime } from 'luxon'

@inject()
export default class TaskController {
  constructor(protected orderService: OrderService) {}

  async index({ inertia, request }: HttpContext): Promise<string | PageObject<{}>> {
    const selectedDate = DateTime.fromISO(String(request.qs().date || DateTime.now().toISODate()))
    const unifiedRoutePlan = await this.orderService.getUnifiedRoutePlanForDate(
      selectedDate,
      -6.9555305,
      107.6540353
    )

    return inertia.render('staff/task/index', {
      unifiedRoutePlan,
      selectedDate: selectedDate.toISODate(),
    })
  }

  async create({ request, inertia }: HttpContext): Promise<string | PageObject<{}>> {
    const stage = request.qs().stage as string

    if (stage === 'inspection') {
      return inertia.render('staff/task/inspection', {})
    }

    return inertia.render('staff/task/pickup_delivery', {})
  }
}
