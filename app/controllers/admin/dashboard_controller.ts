import { type PageObject } from '@adonisjs/inertia/types'
import type { HttpContext } from '@adonisjs/core/http'

export default class DashboardController {
  async index({ inertia }: HttpContext): Promise<string | PageObject<{}>> {
    return inertia.render('admin/dashboard', {})
  }
}
