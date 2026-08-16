import UserService from '#services/user_service'
import UserTransformer from '#transformers/user_transformer'
import { adminUserValidator } from '#validators/admin_validator'
import { userValidator } from '#validators/user_validator'
import type { HttpContext } from '@adonisjs/core/http'
import { inject } from '@adonisjs/core'

@inject()
export default class UserController {
  constructor(protected userService: UserService) {}

  async index({ inertia, request }: HttpContext) {
    const filters = {
      search: request.input('search', '') || '',
      page: Number(request.input('page', 1)) || 1,
      role: request.input('role', '') || '',
    }

    const users = await this.userService.list(filters)

    return inertia.render('admin/user/index', {
      users: UserTransformer.paginate(users.all(), users.getMeta()),
      filters: { search: filters.search, page: filters.page },
      role: filters.role,
      roleCounts: await this.userService.roleCounts(),
      roleOptions: this.userService.roleOptions(),
      undeletableIds: await this.userService.undeletableIds(users.all()),
    })
  }

  async create({ inertia }: HttpContext) {
    return inertia.render('admin/user/create', {
      roleOptions: this.userService.roleOptions(),
    })
  }

  async store({ request, response, session }: HttpContext) {
    const payload = await request.validateUsing(userValidator)

    await this.userService.createAccount(payload)

    session.flash('success', 'Akun berhasil dibuat.')
    return response.redirect().toRoute('admin.user.index')
  }

  async edit({ auth, inertia, params }: HttpContext) {
    const admin = auth.getUserOrFail()
    const account = await this.userService.findUserOrFail(params.id)

    return inertia.render('admin/user/edit', {
      account: UserTransformer.transform(account),
      roleOptions: this.userService.roleOptions(),
      isSelf: account.id === admin.id,
    })
  }

  async update({ params, request, response, session }: HttpContext) {
    const payload = await request.validateUsing(adminUserValidator)

    await this.userService.updateFromAdmin(params.id, payload)

    session.flash('success', 'Akun berhasil diperbarui.')
    return response.redirect().toRoute('admin.user.index')
  }

  async destroy({ auth, params, response, session }: HttpContext) {
    const admin = auth.getUserOrFail()

    await this.userService.deleteAccount(admin, Number(params.id))

    session.flash('success', 'Akun berhasil dihapus.')
    return response.redirect().toRoute('admin.user.index')
  }
}
