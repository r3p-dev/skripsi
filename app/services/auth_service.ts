import User from '#models/user'
import type {
  ForgotPasswordData,
  LoginData,
  SignupData,
  ResetPasswordData,
} from '#validators/auth_validator'
import { inject } from '@adonisjs/core'
import FonnteService from '#services/fonnte_service'
import type { Authenticator } from '@adonisjs/auth'
import { errors as authErrors } from '@adonisjs/auth'
import type { Authenticators } from '@adonisjs/auth/types'
import type { Session } from '@adonisjs/session'
import { signedUrlFor } from '@adonisjs/core/services/url_builder'
import { appUrl } from '#config/app'
import { Role } from '#enums/role_enum'
import { DateTime } from 'luxon'

/**
 * The session key recording when this session was authenticated.
 *
 * Sessions live in a signed cookie, so there is no server-side table of live
 * sessions to delete rows from when a password changes. This stands in for
 * one: a session stamped before the account's current password was set
 * belongs to whoever knew the old password, and is refused on its next
 * request. See `AuthMiddleware`.
 */
export const AUTHENTICATED_AT = 'authenticated_at'

/**
 * Handles signup, login/logout, and the WhatsApp password reset flow.
 */
@inject()
export default class AuthService {
  constructor(private fonnteService: FonnteService) {}

  /**
   * Create a new account and log the user in.
   *
   * Defaults to a customer, and only ever produces anything else when a caller
   * that has already checked who is asking passes a role in — which is the
   * admin account-creation path and nothing else.
   */
  async signup(
    data: SignupData,
    auth: Authenticator<Authenticators>,
    session: Session,
    role?: Role
  ): Promise<User> {
    const user = await User.create({
      ...data,
      role: role || Role.CUSTOMER,
      isActive: true,
      passwordChangedAt: DateTime.now(),
    })

    await auth.use('web').login(user)
    this.stampSession(session)

    return user
  }

  /**
   * Verify credentials and create an authenticated session.
   *
   * A deactivated account is refused with exactly the same error as a wrong
   * password, and deliberately so: a distinct message would tell whoever is
   * typing that the number belongs to a real account that has been switched
   * off, which is more than a rejected login should give away.
   *
   * @throws When credentials are invalid or the account has been deactivated.
   */
  async login(
    data: LoginData,
    auth: Authenticator<Authenticators>,
    session: Session
  ): Promise<User> {
    const { phone, password, rememberMe } = data

    const user = await User.verifyCredentials(phone, password)

    if (!user.isActive) {
      throw new authErrors.E_INVALID_CREDENTIALS('Invalid user credentials')
    }

    await auth.use('web').login(user, Boolean(rememberMe))
    this.stampSession(session)

    return user
  }

  /**
   * Destroy the current authenticated session.
   */
  async logout(auth: Authenticator<Authenticators>): Promise<void> {
    await auth.use('web').logout()
  }

  /**
   * Generate and send a password reset link over WhatsApp.
   *
   * Unknown phone numbers are silently ignored so the response cannot be used
   * to discover which numbers have an account. A deactivated account is
   * treated the same way — sending it a working reset link would hand back the
   * door that deactivating it closed.
   *
   * @throws When the message provider fails.
   */
  async requestPasswordReset(data: ForgotPasswordData): Promise<void> {
    const user = await User.findBy('phone', data.phone)

    if (!user || !user.isActive) {
      return
    }

    const resetUrl = signedUrlFor(
      'password_reset.edit',
      {},
      {
        qs: {
          phone: user.phone,
        },
        expiresIn: '15m',
        prefixUrl: appUrl,
      }
    )

    await this.fonnteService.sendPasswordResetLink(user.phone, resetUrl)
  }

  /**
   * Update password using a validated reset request, and end every session
   * that was opened with the old one.
   *
   * A reset is what someone does when they think their account is not theirs
   * alone any more. Leaving the sessions that prompted it signed in would make
   * the whole exercise a formality: the remember-me tokens are deleted
   * outright, and moving `passwordChangedAt` forward invalidates every cookie
   * session stamped before this moment on its next request.
   *
   * @throws When the user cannot be found.
   */
  async resetPassword(data: ResetPasswordData, phone: string): Promise<User> {
    const user = await User.findByOrFail('phone', phone)

    await user.merge({ password: data.password, passwordChangedAt: DateTime.now() }).save()
    await this.revokeRememberMeTokens(user)

    return user
  }

  /**
   * Deletes the persistent credentials that would otherwise let a session we
   * just invalidated quietly sign itself back in.
   */
  async revokeRememberMeTokens(user: User): Promise<void> {
    const tokens = await User.rememberMeTokens.all(user)

    for (const token of tokens) {
      await User.rememberMeTokens.delete(user, token.identifier)
    }
  }

  /**
   * Records when this session was authenticated, so it can later be compared
   * against the account's `passwordChangedAt`.
   */
  private stampSession(session: Session): void {
    session.put(AUTHENTICATED_AT, DateTime.now().toISO())
  }
}
