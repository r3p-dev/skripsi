import AuthService from '#services/auth_service'
import { loginValidator } from '#validators/auth_validator'
import type { HttpContext } from '@adonisjs/core/http'
import { inject } from '@adonisjs/core'
import { LoginRedirect, type Role } from '#enums/role_enum'
import { DateTime } from 'luxon'

@inject()
export default class SessionController {
  constructor(protected authService: AuthService) {}

  async create({ inertia }: HttpContext) {
    return inertia.render('auth/login', {})
  }

  async createInternal({ inertia }: HttpContext) {
    return inertia.render('auth/internal_login', {})
  }

  async store({ request, response, auth, session }: HttpContext) {
    const payload = await request.validateUsing(loginValidator)

    const user = await this.authService.authenticate(payload)

    await auth.use('web').login(user, Boolean(payload.rememberMe))
    session.put('authenticated_at', DateTime.now().toISO())

    session.flash('success', 'Berhasil masuk.')
    return response.redirect().toRoute(LoginRedirect[user.role as Role])
  }

  async destroy({ auth, response, session }: HttpContext) {
    await auth.use('web').logout()

    session.flash('success', 'Berhasil keluar.')
    return response.redirect().toRoute('home')
  }
}
