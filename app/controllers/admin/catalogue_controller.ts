import { userValidator } from '#validators/user_validator'
import type { HttpContext } from '@adonisjs/core/http'
import { inject } from '@adonisjs/core'
import UserService from '#services/user_service'

@inject()
export default class CatalogueController {
  constructor(protected userService: UserService) {}

  async index({ inertia }: HttpContext) {
    return inertia.render('admin/catalogue/index', {})
  }

  async create({ inertia }: HttpContext) {
    return inertia.render('admin/catalogue/create', {})
  }

  async store({ request, response, session }: HttpContext) {
    const payload = await request.validateUsing(userValidator)

    await this.userService.createAccount(payload)

    session.flash('success', 'Katalog layanan berhasil dibuat')
    return response.redirect().toRoute('admin.dashboard.index')
  }

  async show({ inertia, params }: HttpContext) {
    const { id } = params

    const user = await this.userService.getUserById(id)

    return inertia.render('admin/catalogue/show', { user })
  }

  async edit({ inertia, params }: HttpContext) {
    const { id } = params

    const user = await this.userService.getUserById(id)

    return inertia.render('admin/catalogue/edit', { user })
  }

  async update({ request, response, session, params }: HttpContext) {
    const { id } = params

    const payload = await request.validateUsing(userValidator)

    await this.userService.updateAccount(id, payload)

    session.flash('success', 'Katalog layanan berhasil diperbarui')
    return response.redirect().toRoute('admin.dashboard.index')
  }
}
