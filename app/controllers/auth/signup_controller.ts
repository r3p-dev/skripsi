import AuthService from '#services/auth_service'
import { signupValidator } from '#validators/auth_validator'
import type { HttpContext } from '@adonisjs/core/http'
import { inject } from '@adonisjs/core'

@inject()
export default class SignupController {
  constructor(protected authService: AuthService) {}

  async create({ inertia }: HttpContext) {
    return inertia.render('auth/signup', {})
  }

  async store({ request, response, auth, session }: HttpContext) {
    const payload = await request.validateUsing(signupValidator)

    await this.authService.signup(payload, auth)

    session.flash('success', 'Akun berhasil dibuat. Selamat datang!')
    return response.redirect().toRoute('customer.order.create')
  }
}
