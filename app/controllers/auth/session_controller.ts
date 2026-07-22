import AuthService from '#services/auth_service'
import { loginValidator } from '#validators/auth_validator'
import type { HttpContext } from '@adonisjs/core/http'
import { inject } from '@adonisjs/core'
import { type Role, RoleRedirect } from '#enums/role_enum'
import { type PageObject } from '@adonisjs/inertia/types'

/**
 * Handle user session authentication endpoints.
 */
@inject()
export default class SessionController {
  constructor(protected authService: AuthService) {}

  /**
   * Display the login form.
   */
  async create({ inertia }: HttpContext): Promise<string | PageObject<{}>> {
    return inertia.render('auth/login', {})
  }

  /**
   * Authenticate user using phone and password.
   */
  async store({ request, response, auth }: HttpContext): Promise<void> {
    const payload = await request.validateUsing(loginValidator)

    const user = await this.authService.login(payload, auth)

    return response.redirect().toRoute(RoleRedirect[user.role as Role])
  }

  /**
   * Logout the current authenticated session.
   */
  async destroy({ auth, response }: HttpContext): Promise<void> {
    await this.authService.logout(auth)

    return response.redirect().toRoute('home')
  }
}
