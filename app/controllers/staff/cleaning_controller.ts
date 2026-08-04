import type { HttpContext } from '@adonisjs/core/http'
import { inject } from '@adonisjs/core'
import TaskService from '#services/task_service'
import { cleaningValidator } from '#validators/order_validator'

@inject()
export default class CleaningController {
  constructor(protected taskService: TaskService) {}

  /**
   * Marks an order as finished cleaning, which either sends it to the
   * delivery queue or completes it outright for walk-in customers.
   */
  async update({ auth, params, request, response, session }: HttpContext) {
    const staff = auth.getUserOrFail()
    const payload = await request.validateUsing(cleaningValidator)

    const order = await this.taskService.markCleaningDone(staff, String(params.number), payload)

    session.flash('success', `Pencucian ${order.orderNumber} selesai.`)
    return response.redirect().toRoute('staff.trip.index')
  }
}
