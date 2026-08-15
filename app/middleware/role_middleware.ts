import { LoginRedirect, type Role } from '#enums/role_enum'
import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'

export default class RoleMiddleware {
  async handle({ auth, response, session }: HttpContext, next: NextFn, role: Role | Role[]) {
    const user = auth.getUserOrFail()

    const allowed = Array.isArray(role) ? role : [role]

    if (!allowed.includes(user.role)) {
      session.flash('error', 'Anda tidak memiliki akses ke halaman ini')
      return response.redirect().toRoute(LoginRedirect[user.role as Role])
    }

    return await next()
  }
}
