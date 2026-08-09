import AuthService from '#services/auth_service'
import { signupValidator } from '#validators/auth_validator'
import type { HttpContext } from '@adonisjs/core/http'
import { inject } from '@adonisjs/core'
import { DateTime } from 'luxon'

@inject()
export default class SignupController {
  constructor(protected authService: AuthService) {}

  async create({ inertia }: HttpContext) {
    return inertia.render('auth/signup', {})
  }

  async store({ request, response, auth, session }: HttpContext) {
    const payload = await request.validateUsing(signupValidator)

    const user = await this.authService.signup(payload)

    await auth.use('web').login(user)
    session.put('authenticated_at', DateTime.now().toISO())

    session.flash('success', 'Akun berhasil dibuat. Selamat datang!')
    return response.redirect().toRoute('customer.orders.create')
  }
}
