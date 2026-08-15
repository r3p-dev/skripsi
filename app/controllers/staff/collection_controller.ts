import TaskService from '#services/task_service'
import type { HttpContext } from '@adonisjs/core/http'
import { inject } from '@adonisjs/core'

@inject()
export default class CollectionController {
  constructor(protected taskService: TaskService) {}

  async update({ auth, params, response, session }: HttpContext) {
    const user = auth.getUserOrFail()

    const order = await this.taskService.findSummaryByNumber(params.number)

    await this.taskService.completeCollection(user, order)

    session.flash('success', 'Pesanan ditandai selesai dan sudah diambil pelanggan.')
    return response.redirect().toRoute('staff.trip.index')
  }
}
