import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'
import type { Authenticators } from '@adonisjs/auth/types'
import { AUTHENTICATED_AT } from '#services/auth_service'
import { DateTime } from 'luxon'

/**
 * Auth middleware is used authenticate HTTP requests and deny
 * access to unauthenticated users.
 */
export default class AuthMiddleware {
  /**
   * The URL to redirect to, when authentication fails
   */
  redirectTo = '/login'

  async handle(
    ctx: HttpContext,
    next: NextFn,
    options: {
      guards?: (keyof Authenticators)[]
    } = {}
  ) {
    await ctx.auth.authenticateUsing(options.guards, { loginRoute: this.redirectTo })

    if (this.isStale(ctx)) {
      await ctx.auth.use('web').logout()

      ctx.session.flash('error', 'Sesi Anda sudah berakhir. Silakan masuk kembali.')
      return ctx.response.redirect().toRoute('session.create')
    }

    return next()
  }

  /**
   * Whether this session should stop being honoured, even though its cookie is
   * intact and correctly signed.
   *
   * Two things end a session the browser still believes in. An account that
   * has been deactivated — a staff member who has left — has to stop working
   * on their next request rather than at the end of whatever they had open.
   * And a session opened before the account's current password was set belongs
   * to whoever knew the old password, which is exactly who a reset exists to
   * lock out. Sessions are signed cookies, so there is no server-side table to
   * delete them from; the comparison happens here instead, on the way in.
   */
  private isStale(ctx: HttpContext): boolean {
    const user = ctx.auth.user

    if (!user || !user.isActive) {
      return true
    }

    if (!user.passwordChangedAt) {
      return false
    }

    const authenticatedAt = ctx.session.get(AUTHENTICATED_AT)

    /**
     * A session carrying no stamp predates the stamping. Treating it as stale
     * asks those users to sign in once more; treating it as fresh would mean a
     * password reset spared precisely the oldest sessions of all.
     */
    if (typeof authenticatedAt !== 'string') {
      return true
    }

    return DateTime.fromISO(authenticatedAt) < user.passwordChangedAt
  }
}
