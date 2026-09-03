import User from '#models/user'
import type {
  ForgotPasswordData,
  LoginData,
  SignupData,
  ResetPasswordData,
} from '#validators/auth_validator'
import { inject } from '@adonisjs/core'
import WhatsappService from '#notifications/whatsapp_service'
import { errors as authErrors } from '@adonisjs/auth'
import { signedUrlFor } from '@adonisjs/core/services/url_builder'
import { appUrl } from '#config/app'
import { Role } from '#enums/role_enum'
import { DateTime } from 'luxon'

@inject()
export default class AuthService {
  constructor(private whatsappService: WhatsappService) {}

  async signup(data: SignupData): Promise<User> {
    return User.create({ ...data, role: Role.CUSTOMER })
  }

  async authenticate(data: LoginData): Promise<User> {
    const user = await User.verifyCredentials(data.phone, data.password)

    if (!user.isActive) {
      throw new authErrors.E_INVALID_CREDENTIALS()
    }

    return user
  }

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

    await this.whatsappService.sendPasswordResetLink(user.phone, resetUrl)
  }

  async resetPassword(data: ResetPasswordData, phone: string): Promise<void> {
    const user = await User.findByOrFail('phone', phone)

    await user
      .merge({
        password: data.password,
        passwordChangedAt: DateTime.now(),
      })
      .save()

    await this.#revokeRememberMeTokens(user)
  }

  async #revokeRememberMeTokens(user: User): Promise<void> {
    const tokens = await User.rememberMeTokens.all(user)

    for (const token of tokens) {
      await User.rememberMeTokens.delete(user, token.identifier)
    }
  }
}
