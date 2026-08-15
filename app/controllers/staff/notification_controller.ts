import TaskService from '#services/task_service'
import type { HttpContext } from '@adonisjs/core/http'
import { inject } from '@adonisjs/core'
import { errors as vineErrors } from '@vinejs/vine'

@inject()
export default class NotificationController {
  constructor(protected taskService: TaskService) {}

  async store({ auth, params, response, session }: HttpContext) {
    const user = auth.getUserOrFail()

    const order = await this.taskService.findSummaryByNumber(params.number)

    try {
      await this.taskService.sendReadyNotice(user, order)
      session.flash('success', 'Pelanggan sudah dikabari lewat WhatsApp.')
    } catch (error) {
      if (error instanceof vineErrors.E_VALIDATION_ERROR) {
        throw error
      }

      session.flash('error', 'Gagal mengirim pesan WhatsApp. Silakan coba lagi.')
    }

    return response.redirect().toRoute('staff.trip.index')
  }
}
