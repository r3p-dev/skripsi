import User from '#models/user'
import type {
  ChangePasswordData,
  ForgotPasswordData,
  LoginData,
  SignupData,
  ResetPasswordData,
} from '#validators/auth_validator'
import { inject } from '@adonisjs/core'
import db from '@adonisjs/lucid/services/db'
import FonnteService from '#services/fonnte_service'
import type { Authenticator } from '@adonisjs/auth'
import type { Authenticators } from '@adonisjs/auth/types'
import { signedUrlFor } from '@adonisjs/core/services/url_builder'
import { appUrl } from '#config/app'
import { Role } from '#enums/role_enum'

/**
 * Manages customer authentication and account security workflows.
 *
 * Responsibilities:
 * - Register new customer accounts.
 * - Authenticate users and manage web sessions.
 * - Handle password changes for authenticated users.
 * - Coordinate password reset requests and password recovery flows.
 */
@inject()
export default class AuthService {
  constructor(private fonnteService: FonnteService) {}

  /**
   * Create a new customer account and immediately establish an authenticated
   * web session.
   *
   * This method is intended for self-service customer registration and
   * automatically logs the user in after a successful signup.
   *
   * @param data - Validated registration payload.
   * @param auth - Authenticator instance for the current request.
   * @returns A promise that resolves when the account has been created and
   * the session has been established.
   */
  async signup(data: SignupData, auth: Authenticator<Authenticators>): Promise<void> {
    const user = await User.create({ ...data, role: Role.CUSTOMER })

    return auth.use('web').login(user)
  }

  /**
   * Verify customer credentials and establish a web session.
   *
   * Supports optional persistent authentication through the "remember me"
   * functionality when requested by the customer.
   *
   * @param data - Validated login credentials.
   * @param auth - Authenticator instance for the current request.
   * @returns The authenticated user.
   * @throws When the provided credentials are invalid.
   */
  async login(data: LoginData, auth: Authenticator<Authenticators>): Promise<User> {
    const { phone, password, rememberMe } = data

    const user = await User.verifyCredentials(phone, password)

    await auth.use('web').login(user, Boolean(rememberMe))

    return user
  }

  /**
   * Terminate the current authenticated web session.
   *
   * This method invalidates the active session and removes the user's
   * authenticated state from subsequent requests.
   *
   * @param auth - Authenticator instance for the current request.
   * @returns A promise that resolves when the session has been destroyed.
   */
  async logout(auth: Authenticator<Authenticators>): Promise<void> {
    await auth.use('web').logout()
  }

  /**
   * Update the authenticated user's password.
   *
   * The current password must be verified before the new password is
   * persisted. The update is executed within a database transaction to
   * guarantee consistency.
   *
   * @param data - Validated password change payload.
   * @param user - Authenticated user requesting the password change.
   * @returns The updated user model.
   * @throws When the current password verification fails.
   */
  async changePassword(data: ChangePasswordData, user: User): Promise<User> {
    const { currentPassword, password } = data

    await user.validatePassword(currentPassword, 'current_password')

    return db.transaction((trx) =>
      user
        .merge({
          password,
        })
        .useTransaction(trx)
        .save()
    )
  }

  /**
   * Generate and send a password reset link for a registered customer.
   *
   * A signed reset URL with a limited validity period is generated and
   * delivered through the configured messaging provider. No action is taken
   * when the provided phone number is not associated with an account.
   *
   * @param data - Validated password reset request payload.
   * @returns The matching user when found; otherwise `null`.
   */
  async requestPasswordReset(data: ForgotPasswordData): Promise<void> {
    const user = await User.findBy('phone', data.phone)

    if (user) {
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
  }

  /**
   * Persist a new password using a verified password reset request.
   *
   * This method is intended to be executed only after the password reset
   * token or signed URL has been successfully validated by the application.
   * The password update is performed within a database transaction.
   *
   * @param data - Validated password reset payload.
   * @param phone - Phone number associated with the account being recovered.
   * @returns A promise that resolves when the password has been updated.
   * @throws When no user exists for the provided phone number.
   */
  async resetPassword(data: ResetPasswordData, phone: string): Promise<void> {
    const user = await User.findByOrFail('phone', phone)

    return db.transaction(async (trx) => {
      await user
        .merge({
          password: data.password,
        })
        .useTransaction(trx)
        .save()
    })
  }
}
