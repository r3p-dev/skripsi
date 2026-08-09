import User from '#models/user'
import type {
  ChangeNameData,
  ChangePasswordData,
  ChangePhoneData,
} from '#validators/profile_validator'
import { errors } from '@vinejs/vine'
import { Role } from '#enums/role_enum'
import FonnteService from '#services/fonnte_service'
import { inject } from '@adonisjs/core'
import { appUrl } from '#config/app'
import { signedUrlFor } from '@adonisjs/core/services/url_builder'

const PHONE_VERIFICATION_ROUTE = {
  [Role.CUSTOMER]: 'customer.phone.update',
  [Role.STAFF]: 'staff.phone.update',
  [Role.ADMIN]: 'admin.phone.update',
} as const

@inject()
export default class ProfileService {
  constructor(private fonnteService: FonnteService) {}

  async changeName(data: ChangeNameData, user: User): Promise<void> {
    await user.merge({ name: data.name }).save()
  }

  async changePassword(data: ChangePasswordData, user: User): Promise<void> {
    const isCurrentPasswordCorrect = await user.verifyPassword(data.currentPassword)

    if (!isCurrentPasswordCorrect) {
      throw new errors.E_VALIDATION_ERROR([
        {
          field: 'currentPassword',
          message: 'Kata sandi saat ini salah',
        },
      ])
    }

    await user.merge({ password: data.password }).save()
  }

  async requestChangePhone(data: ChangePhoneData, user: User): Promise<void> {
    if (data.phone === user.phone) {
      this.#phoneValidationError(
        'Nomor telepon baru tidak boleh sama dengan nomor telepon saat ini'
      )
    }

    const isPhoneTaken = await User.findBy('phone', data.phone)

    if (isPhoneTaken) {
      this.#phoneValidationError(
        'Nomor telepon tersebut sudah digunakan akun lain. Silakan ajukan ulang.'
      )
    }

    const verificationUrl = this.#createPhoneVerificationUrl(user, data.phone)

    await this.fonnteService.sendVerificationLink(data.phone, verificationUrl)
  }

  #createPhoneVerificationUrl(user: User, phone: string): string {
    return signedUrlFor(
      PHONE_VERIFICATION_ROUTE[user.role as Role],
      {},
      {
        qs: {
          phone,
          userId: user.id,
        },
        expiresIn: '15m',
        prefixUrl: appUrl,
      }
    )
  }

  async verifyPhoneChange(phone: string, user: User): Promise<void> {
    if (phone === user.phone) {
      return
    }

    const taken = await User.query().where('phone', phone).whereNot('id', user.id).first()

    if (taken) {
      this.#phoneValidationError(
        'Nomor telepon tersebut sudah digunakan akun lain. Silakan ajukan ulang.'
      )
    }

    await user.merge({ phone }).save()
  }

  #phoneValidationError(message: string): never {
    throw new errors.E_VALIDATION_ERROR([
      {
        field: 'phone',
        message: message,
      },
    ])
  }
}
