import type { HttpContext } from '@adonisjs/core/http'
import { inject } from '@adonisjs/core'
import TaskService, { type PhotoTaskType } from '#services/task_service'
import RouteItemTransformer from '#transformers/route_item_transformer'
import OrderTransformer from '#transformers/order_transformer'
import { completeTaskValidator } from '#validators/order_validator'

/**
 * Coordinates of the service center, used as the starting
 * point when building staff pickup and delivery routes.
 */
const STORE_LATITUDE = -6.9555305
const STORE_LONGITUDE = 107.6540353

@inject()
export default class TripController {
  constructor(protected service: TaskService) {}

  async index({ inertia }: HttpContext) {
    const routePlan = await this.service.getUnifiedRoutePlanForDate(STORE_LATITUDE, STORE_LONGITUDE)

    return inertia.render('staff/trip/index', {
      today: RouteItemTransformer.transform(routePlan.today),
      missed: RouteItemTransformer.transform(routePlan.missed),
    })
  }

  async show({ auth, params, inertia }: HttpContext) {
    const staff = auth.getUserOrFail()
    const type = params.type as PhotoTaskType

    const { order, lock } = await this.service.claimTask(staff, String(params.number), type)

    return inertia.render('staff/trip/show', {
      type,
      order: OrderTransformer.transform(order),
      blocked: lock.staffId !== staff.id,
    })
  }

  async update({ auth, params, request, response }: HttpContext) {
    const staff = auth.getUserOrFail()
    const type = params.type as PhotoTaskType
    const payload = await request.validateUsing(completeTaskValidator)

    await this.service.completeTask(staff, String(params.number), type, payload)

    return response.redirect().toRoute('staff.trip.index')
  }

  async destroy({ auth, params, response, session }: HttpContext) {
    const staff = auth.getUserOrFail()
    const type = params.type as PhotoTaskType

    await this.service.releaseTask(staff, String(params.number), type)

    session.flash('success', 'Tugas dibatalkan.')
    return response.redirect().toRoute('staff.trip.index')
  }
}
