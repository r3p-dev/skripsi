import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'
import type { Authenticators } from '@adonisjs/auth/types'
import { DateTime } from 'luxon'

export default class AuthMiddleware {
  async handle(
    ctx: HttpContext,
    next: NextFn,
    options: {
      guards?: (keyof Authenticators)[]
    } = {}
  ) {
    await ctx.auth.authenticateUsing(options.guards, { loginRoute: '/login' })

    if (this.#isStale(ctx)) {
      await ctx.auth.use('web').logout()

      ctx.session.flash('error', 'Sesi Anda sudah berakhir. Silakan masuk kembali.')
      return ctx.response.redirect().toRoute('session.create')
    }

    return next()
  }

  #isStale(ctx: HttpContext): boolean {
    const user = ctx.auth.user

    if (!user || !user.isActive) {
      return true
    }

    if (!user.passwordChangedAt) {
      return false
    }

    const authenticatedAt = ctx.session.get('authenticated_at')

    if (typeof authenticatedAt !== 'string') {
      return true
    }

    return DateTime.fromISO(authenticatedAt) < user.passwordChangedAt
  }
}
