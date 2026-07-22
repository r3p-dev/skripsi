import AuthService from '#services/auth_service'
import { signupValidator } from '#validators/auth_validator'
import type { HttpContext } from '@adonisjs/core/http'
import { inject } from '@adonisjs/core'
import { type PageObject } from '@adonisjs/inertia/types'

/**
 * Handle customer registration requests.
 */
@inject()
export default class SignupController {
  constructor(protected authService: AuthService) {}

  /**
   * Display the signup form.
   */
  async create({ inertia }: HttpContext): Promise<string | PageObject<{}>> {
    return inertia.render('auth/signup', {})
  }

  /**
   * Sign up a new customer using phone and password.
   */
  async store({ request, response, auth }: HttpContext): Promise<void> {
    const payload = await request.validateUsing(signupValidator)

    await this.authService.signup(payload, auth)

    return response.redirect().toRoute('customer.address.show')
  }
}
