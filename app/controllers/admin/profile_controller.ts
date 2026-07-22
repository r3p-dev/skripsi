import { type PageObject } from '@adonisjs/inertia/types'
import type { HttpContext } from '@adonisjs/core/http'

export default class ProfileController {
  async show({ inertia }: HttpContext): Promise<string | PageObject<{}>> {
    return inertia.render('admin/profile', {})
  }
}
