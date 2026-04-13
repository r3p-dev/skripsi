import { Role } from '#models/user'
import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'

export default class RoleMiddleware {
  async handle(ctx: HttpContext, next: NextFn, role: Role) {
    const { auth, response, session } = ctx
    const user = auth.getUserOrFail()

    const roleRedirects = {
      [Role.CUSTOMER]: 'order.create',
      [Role.STAFF]: 'task.index',
      [Role.ADMIN]: 'dashboard.index',
    } as const

    if (user.role !== role) {
      session.flash('error', 'Anda tidak memiliki akses ke halaman ini')
      return response.redirect().toRoute(roleRedirects[user.role as Role])
    }

    return await next()
  }
}
