import type { HttpContext } from '@adonisjs/core/http'
import { inject } from '@adonisjs/core'
import TaskService from '#services/task_service'

@inject()
export default class CollectionController {
  constructor(protected taskService: TaskService) {}

  /**
   * Closes a walk-in order once its owner has taken it home from the counter.
   *
   * This is the step that used to be missing. A washed walk-in order went
   * straight to "Selesai" while the shoes were still on the shelf, so nothing
   * in the system could tell the difference between an order that was finished
   * and one that was merely ready — which is exactly the difference the person
   * at the counter needs to see.
   */
  async update({ auth, params, response, session }: HttpContext) {
    const staff = auth.getUserOrFail()

    const order = await this.taskService.markCollected(staff, String(params.number))

    session.flash('success', `Pesanan ${order.orderNumber} sudah diambil pelanggan.`)
    return response.redirect().toRoute('staff.trip.index')
  }
}
