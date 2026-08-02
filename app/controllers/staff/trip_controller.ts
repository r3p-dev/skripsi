import type { HttpContext } from '@adonisjs/core/http'
import { inject } from '@adonisjs/core'
import { ActionName } from '#enums/order_action_enum'
import TaskService, { type PhotoTaskType } from '#services/task_service'
import RouteItemTransformer from '#transformers/route_item_transformer'
import OrderTransformer from '#transformers/order_transformer'
import { completeTaskValidator } from '#validators/order_validator'

@inject()
export default class TripController {
  constructor(protected taskService: TaskService) {}

  /**
   * The staff home screen: one tabbed queue covering trips, inspections,
   * cleaning, and the shelf of washed walk-ins waiting to be collected. A
   * staff member already holding a task is sent straight back to it, since
   * they may only work one task at a time.
   *
   * The trip and inspection cards go out in the deliberately narrow queue
   * shape — an order number, a badge, and for a trip how far away it is. This
   * board is on the screen of everyone on shift whether or not they take the
   * job, so it is not where customer names, numbers and front doors belong.
   * Those arrive with the task once somebody claims it, at which point the
   * claim is on the record under their name.
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

    const [trips, inspections, cleanings, collections] = await Promise.all([
      this.taskService.getTripQueue(),
      this.taskService.getInspectionQueue(),
      this.taskService.getCleaningQueue(),
      this.taskService.getCollectionQueue(),
    ])

    return inertia.render('staff/trip/index', {
      trips: RouteItemTransformer.transform(trips),
      inspections: OrderTransformer.transform(inspections).useVariant('toQueue'),
      /**
       * The two counter queues carry more than a queue card usually would,
       * and for reasons that are about the work rather than about the
       * customer: the washer needs the inspection photo to compare against,
       * and the person at the counter needs the phone number to tell somebody
       * their shoes are ready.
       */
      cleanings: OrderTransformer.transform(cleanings).useVariant('toDetail'),
      collections: OrderTransformer.transform(collections).useVariant('toDetail'),
    })
  }

  async show({ auth, params, inertia }: HttpContext) {
    const staff = auth.getUserOrFail()
    const type = params.type as PhotoTaskType

    const { order, lock } = await this.taskService.claimTask(staff, String(params.number), type)

    return inertia.render('staff/trip/show', {
      type,
      order: OrderTransformer.transform(order).useVariant('toDetail'),
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
