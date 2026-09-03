import PhoneChangeRequest from '#models/phone_change_request'
import User from '#models/user'
import type {
  ChangeNameData,
  ChangePasswordData,
  ChangePhoneData,
} from '#validators/profile_validator'
import { errors } from '@vinejs/vine'
import { Role } from '#enums/role_enum'
import type WhatsappService from '#notifications/whatsapp_service'
import db from '@adonisjs/lucid/services/db'
import logger from '@adonisjs/core/services/logger'
import { appUrl } from '#config/app'
import { signedUrlFor } from '@adonisjs/core/services/url_builder'
import { DateTime } from 'luxon'

export const PHONE_VERIFICATION_ROUTE = {
  [Role.CUSTOMER]: 'customer.phone.update',
  [Role.STAFF]: 'staff.phone.update',
  [Role.ADMIN]: 'admin.phone.update',
} as const

export type PhoneVerificationRoute =
  (typeof PHONE_VERIFICATION_ROUTE)[keyof typeof PHONE_VERIFICATION_ROUTE]

export const PHONE_VERIFICATION_TTL = { minutes: 15 }

export default abstract class ProfileService {
  protected abstract readonly phoneVerificationRoute: PhoneVerificationRoute

  constructor(protected whatsappService: WhatsappService) {}

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

    await this.#holdPhone(data.phone, user)

    const verificationUrl = this.#createPhoneVerificationUrl(user, data.phone)

    try {
      await this.whatsappService.sendVerificationLink(data.phone, verificationUrl)
    } catch (error) {
      await this.#releasePhone(data.phone, user)

      throw error
    }

    await this.#warnCurrentPhone(user, data.phone)
  }

  async #holdPhone(phone: string, user: User): Promise<void> {
    const now = DateTime.now()

    await PhoneChangeRequest.query().where('expires_at', '<=', now.toSQL()).delete()

    await PhoneChangeRequest.query().where('user_id', user.id).delete()

    const held = await db
      .table('phone_change_requests')
      .insert({
        user_id: user.id,
        phone,
        expires_at: now.plus(PHONE_VERIFICATION_TTL).toSQL(),
        created_at: now.toSQL(),
        updated_at: now.toSQL(),
      })
      .onConflict('phone')
      .ignore()
      .returning('id')

    if (held.length === 0) {
      this.#phoneValidationError(
        'Nomor telepon tersebut sedang menunggu verifikasi akun lain. Silakan coba lagi nanti.'
      )
    }
  }

  async #releasePhone(phone: string, user: User): Promise<void> {
    await PhoneChangeRequest.query().where('user_id', user.id).where('phone', phone).delete()
  }

  async #warnCurrentPhone(user: User, newPhone: string): Promise<void> {
    try {
      await this.whatsappService.sendPhoneChangeNotice(user.phone, newPhone)
    } catch (error) {
      logger.warn(
        { err: error, userId: user.id },
        'Could not warn the old number of a phone change'
      )
    }
  }

  #createPhoneVerificationUrl(user: User, phone: string): string {
    return signedUrlFor(
      this.phoneVerificationRoute,
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

    const held = await PhoneChangeRequest.query()
      .where('user_id', user.id)
      .where('phone', phone)
      .where('expires_at', '>', DateTime.now().toSQL())
      .first()

    if (!held) {
      this.#phoneValidationError(
        'Permintaan perubahan nomor telepon sudah tidak berlaku. Silakan ajukan ulang.'
      )
    }

    const taken = await User.query().where('phone', phone).whereNot('id', user.id).first()

    if (taken) {
      this.#phoneValidationError(
        'Nomor telepon tersebut sudah digunakan akun lain. Silakan ajukan ulang.'
      )
    }

    await user.merge({ phone }).save()
    await held.delete()
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
