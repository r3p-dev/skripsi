import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'
import type { Authenticators } from '@adonisjs/auth/types'
import { Role } from '#models/user'

export default class GuestMiddleware {
  async handle(
    ctx: HttpContext,
    next: NextFn,
    options: { guards?: (keyof Authenticators)[] } = {}
  ) {
    for (let guard of options.guards || [ctx.auth.defaultGuard]) {
      if (await ctx.auth.use(guard).check()) {
        const roleRedirects = {
          [Role.CUSTOMER]: 'order.create',
          [Role.STAFF]: 'task.index',
          [Role.ADMIN]: 'dashboard.index',
        } as const

        ctx.session.reflash()
        return ctx.response
          .redirect()
          .toRoute(roleRedirects[ctx.auth.use(guard).user!.role as Role])
      }
    }

    return next()
  }
}
