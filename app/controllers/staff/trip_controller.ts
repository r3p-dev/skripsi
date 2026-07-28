import type { HttpContext } from '@adonisjs/core/http'
import { inject } from '@adonisjs/core'
import { ActionName } from '#enums/order_action_enum'
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
  constructor(protected taskService: TaskService) {}

  /**
   * The staff home screen: one tabbed queue covering trips, inspections and
   * cleaning. A staff member already holding a task is sent straight back to
   * it, since they may only work one task at a time.
   */
  async index({ auth, response, inertia }: HttpContext) {
    const staff = auth.getUserOrFail()

    const activeTask = await this.taskService.findActiveTask(staff)

    if (activeTask?.type === ActionName.INSPECTION) {
      return response
        .redirect()
        .toRoute('staff.inspection.show', { number: activeTask.orderNumber })
    }

    if (activeTask) {
      return response.redirect().toRoute('staff.trip.show', {
        number: activeTask.orderNumber,
        type: activeTask.type,
      })
    }

    const trips = await this.taskService.getTripQueue(STORE_LATITUDE, STORE_LONGITUDE)
    const inspections = await this.taskService.getInspectionQueue()
    const cleanings = await this.taskService.getCleaningQueue()

    return inertia.render('staff/trip/index', {
      trips: RouteItemTransformer.transform(trips),
      inspections: OrderTransformer.transform(inspections),
      cleanings: OrderTransformer.transform(cleanings),
    })
  }

  async show({ auth, params, inertia }: HttpContext) {
    const staff = auth.getUserOrFail()
    const type = params.type as PhotoTaskType

    const { order, lock } = await this.taskService.claimTask(staff, String(params.number), type)

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

    await this.taskService.completeTask(staff, String(params.number), type, payload)

    return response.redirect().toRoute('staff.trip.index')
  }

  async destroy({ auth, params, response, session }: HttpContext) {
    const staff = auth.getUserOrFail()
    const type = params.type as PhotoTaskType

    await this.taskService.releaseTask(staff, String(params.number), type)

    session.flash('success', 'Tugas dibatalkan.')
    return response.redirect().toRoute('staff.trip.index')
  }
}
