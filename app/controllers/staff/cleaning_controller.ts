import TaskService from '#services/task_service'
import { taskPhotoValidator } from '#validators/task_validator'
import type { HttpContext } from '@adonisjs/core/http'
import { inject } from '@adonisjs/core'

@inject()
export default class CleaningController {
  constructor(protected taskService: TaskService) {}

  async update({ auth, params, request, response, session }: HttpContext) {
    const user = auth.getUserOrFail()

    const { photo } = await request.validateUsing(taskPhotoValidator)
    const order = await this.taskService.findSummaryByNumber(params.number)

    const updated = await this.taskService.completeCleaning(user, order, photo)

    session.flash(
      'success',
      this.taskService.awaitsDelivery(updated)
        ? 'Pencucian selesai. Pesanan masuk antrean pengantaran.'
        : 'Pencucian selesai. Pelanggan dapat mengambil pesanannya di toko.'
    )

    return response.redirect().toRoute('staff.trip.index')
  }
}
