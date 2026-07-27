import User from '#models/user'
import type {
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

@inject()
export default class AuthService {
  constructor(private service: FonnteService) {}

  /**
   * Create a new customer account and log the user in.
   */
  async signup(data: SignupData, auth: Authenticator<Authenticators>, role?: Role): Promise<void> {
    const user = await User.create({ ...data, role: role || Role.CUSTOMER })

    return auth.use('web').login(user)
  }

  /**
   * Verify credentials and create an authenticated session.
   *
   * @throws When credentials are invalid.
   */
  async login(data: LoginData, auth: Authenticator<Authenticators>): Promise<User> {
    const { phone, password, rememberMe } = data

    const user = await User.verifyCredentials(phone, password)
    await auth.use('web').login(user, Boolean(rememberMe))

    return user
  }

  /**
   * Destroy the current authenticated session.
   */
  async logout(auth: Authenticator<Authenticators>): Promise<void> {
    await auth.use('web').logout()
  }

  /**
   * Generate and send a password reset link.
   *
   * Does nothing when the phone number is not registered.
   *
   * @throws When the message provider fails.
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

      await this.service.sendPasswordResetLink(user.phone, resetUrl)
    }
  }

  /**
   * Update password using a validated reset request.
   *
   * @throws When the user cannot be found.
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
