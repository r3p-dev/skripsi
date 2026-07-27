import User from '#models/user'
import type {
  ChangeNameData,
  ChangePasswordData,
  ChangePhoneData,
} from '#validators/profile_validator'
import { errors } from '@vinejs/vine'
import db from '@adonisjs/lucid/services/db'
import { OrderStatus } from '#enums/order_status_enum'
import FonnteService from '#services/fonnte_service'
import { inject } from '@adonisjs/core'
import { appUrl } from '#config/app'
import { signedUrlFor } from '@adonisjs/core/services/url_builder'

@inject()
export default class ProfileService {
  constructor(private service: FonnteService) {}

  /**
   * Get the total number of completed orders for a user.
   */
  async getTotalOrders(user: User): Promise<number> {
    await user.loadCount('orders', (query) => {
      query.where('status', OrderStatus.COMPLETED)
    })

    return Number(user.$extras.orders_count)
  }

  /**
   * Change password after verifying the current password.
   *
   * @throws Validation error when current password is incorrect.
   */
  async changePassword(data: ChangePasswordData, user: User): Promise<User> {
    const { currentPassword, password } = data

    const isValid = await user.verifyPassword(currentPassword)
    if (!isValid) {
      throw new errors.E_VALIDATION_ERROR([
        {
          field: 'currentPassword',
          message: 'Kata sandi saat ini salah',
        },
      ])
    }

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
   * Change the user's name.
   */
  async changeName(data: ChangeNameData, user: User): Promise<User> {
    return db.transaction((trx) =>
      user
        .merge({
          name: data.name,
        })
        .useTransaction(trx)
        .save()
    )
  }

  /**
   * Change the user's phone number.
   *
   * @throws Validation error when the new phone number is the same as the old one or already in use.
   */
  async requestChangePhone(data: ChangePhoneData, user: User): Promise<void> {
    if (data.phone === user.phone) {
      throw new errors.E_VALIDATION_ERROR([
        {
          field: 'phone',
          message: 'Nomor telepon baru tidak boleh sama dengan yang lama',
        },
      ])
    }

    if (await User.findBy('phone', data.phone)) {
      throw new errors.E_VALIDATION_ERROR([
        {
          field: 'phone',
          message: 'Nomor telepon sudah digunakan',
        },
      ])
    }

    const resetUrl = signedUrlFor(
      'customer.phone.update',
      {},
      {
        qs: {
          phone: data.phone,
        },
        expiresIn: '15m',
        prefixUrl: appUrl,
      }
    )

    await this.service.sendVerificationLink(data.phone, resetUrl)
  }

  /**
   * Change the user's phone number after verifying the request.
   */
  async verifyPhoneChange(phone: string, user: User): Promise<User> {
    return db.transaction((trx) =>
      user
        .merge({
          phone,
        })
        .useTransaction(trx)
        .save()
    )
  }
}
