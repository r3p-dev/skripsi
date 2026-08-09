import { userValidator } from '#validators/user_validator'
import type { HttpContext } from '@adonisjs/core/http'
import { inject } from '@adonisjs/core'
import UserService from '#services/user_service'

@inject()
export default class UserController {
  constructor(protected userService: UserService) {}

  async index({ inertia }: HttpContext) {
    return inertia.render('admin/user/index', {})
  }

  async create({ inertia }: HttpContext) {
    return inertia.render('admin/user/create', {})
  }

  async store({ request, response, session }: HttpContext) {
    const payload = await request.validateUsing(userValidator)

    await this.userService.createAccount(payload)

    session.flash('success', 'Akun berhasil dibuat')
    return response.redirect().toRoute('admin.users.index')
  }

  async show({ inertia, params }: HttpContext) {
    const { id } = params

    const user = await this.userService.getUserById(id)

    return inertia.render('admin/user/show', { user })
  }

  async edit({ inertia, params }: HttpContext) {
    const { id } = params

    const user = await this.userService.getUserById(id)

    return inertia.render('admin/user/edit', { user })
  }

  async update({ request, response, session, params }: HttpContext) {
    const { id } = params

    const payload = await request.validateUsing(userValidator)

    await this.userService.updateAccount(id, payload)

    session.flash('success', 'Akun berhasil diperbarui')
    return response.redirect().toRoute('admin.users.index')
  }
}
