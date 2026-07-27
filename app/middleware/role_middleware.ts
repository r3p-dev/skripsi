import { type Role, RoleRedirect } from '#enums/role_enum'
import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'

/**
 * Authorize authenticated users by role.
 */
export default class RoleMiddleware {
  /**
   * Middleware handler that checks if the user has the required role.
   * Redirects to the appropriate route if the user does not have the required role.
   *
   * @param ctx - The HTTP context.
   * @param next - The next middleware function.
   * @param role - The required role.
   */
  async handle(ctx: HttpContext, next: NextFn, role: Role) {
    const { auth, response, session } = ctx
    const user = auth.getUserOrFail()

    if (user.role !== role) {
      session.flash('error', 'Anda tidak memiliki akses ke halaman ini')
      return response.redirect().toRoute(RoleRedirect[user.role as Role])
    }

    return await next()
  }
}
