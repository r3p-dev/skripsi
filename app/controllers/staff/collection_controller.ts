import TaskService from '#services/task_service'
import { taskPhotoValidator } from '#validators/task_validator'
import type { HttpContext } from '@adonisjs/core/http'
import { inject } from '@adonisjs/core'

@inject()
export default class CollectionController {
  constructor(protected taskService: TaskService) {}

  async update({ auth, params, request, response, session }: HttpContext) {
    const user = auth.getUserOrFail()

    const { photo } = await request.validateUsing(taskPhotoValidator)
    const order = await this.taskService.findSummaryByNumber(params.number)

    await this.taskService.completeCollection(user, order, photo)

    session.flash('success', 'Pesanan ditandai selesai dan sudah diambil pelanggan.')
    return response.redirect().toRoute('staff.trip.index')
  }
}
