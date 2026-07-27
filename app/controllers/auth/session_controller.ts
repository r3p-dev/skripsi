import AuthService from '#services/auth_service'
import { loginValidator } from '#validators/auth_validator'
import type { HttpContext } from '@adonisjs/core/http'
import { inject } from '@adonisjs/core'
import { type Role, RoleRedirect } from '#enums/role_enum'
import { errors as authErrors } from '@adonisjs/auth'
import { errors as vineErrors } from '@vinejs/vine'

@inject()
export default class SessionController {
  constructor(protected service: AuthService) {}

  async create({ inertia }: HttpContext) {
    return inertia.render('auth/login', {})
  }

  async store({ request, response, auth, session }: HttpContext) {
    try {
      const payload = await request.validateUsing(loginValidator)

      const user = await this.service.login(payload, auth)

      session.flash('success', 'Berhasil masuk.')
      return response.redirect().toRoute(RoleRedirect[user.role as Role])
    } catch (error) {
      if (error instanceof authErrors.E_INVALID_CREDENTIALS) {
        throw new vineErrors.E_VALIDATION_ERROR([
          {
            field: 'phone',
            message: 'Nomor telepon atau kata sandi salah.',
          },
          {
            field: 'password',
            message: 'Nomor telepon atau kata sandi salah.',
          },
        ])
      }

      throw error
    }
  }

  async destroy({ auth, response, session }: HttpContext) {
    await this.service.logout(auth)

    session.flash('success', 'Berhasil keluar.')
    return response.redirect().toRoute('home')
  }
}
