import { type PageObject } from '@adonisjs/inertia/types'
import type { HttpContext } from '@adonisjs/core/http'

export default class OfflineOrderController {
  async create({ inertia }: HttpContext): Promise<string | PageObject<{}>> {
    return inertia.render('staff/offline_order', {})
  }
}
