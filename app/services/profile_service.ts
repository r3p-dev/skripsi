import User from '#models/user'
import type {
  ChangeNameData,
  ChangePasswordData,
  ChangePhoneData,
} from '#validators/profile_validator'
import { errors } from '@vinejs/vine'
import OrderAction from '#models/order_action'
import { ActionName } from '#enums/order_action_enum'
import { OrderStatus } from '#enums/order_status_enum'
import { Role } from '#enums/role_enum'
import FonnteService from '#services/fonnte_service'
import { inject } from '@adonisjs/core'
import { appUrl } from '#config/app'
import { signedUrlFor } from '@adonisjs/core/services/url_builder'

/**
 * The actions that mean a staff member finished a piece of work, as opposed to
 * claiming or releasing one.
 */
const COMPLETED_TASK_ACTIONS: string[] = [
  ActionName.PICKUP,
  ActionName.DELIVERY,
  ActionName.INSPECTION,
  ActionName.CLEANING_DONE,
]

/**
 * The route each role opens to confirm a new phone number. Mirrors
 * `RoleRedirect`: every role has its own copy of the screen behind its own
 * role middleware, so the verification link must match the requesting user.
 */
const PHONE_VERIFICATION_ROUTE = {
  [Role.CUSTOMER]: 'customer.phone.update',
  [Role.STAFF]: 'staff.phone.update',
  [Role.ADMIN]: 'admin.phone.update',
} as const

/**
 * Manages a user's own account details: name, password, and the
 * WhatsApp-verified phone number change flow.
 */
@inject()
export default class ProfileService {
  constructor(private fonnteService: FonnteService) {}

  /**
   * Counts the tasks a staff member has finished.
   *
   * Staff place no orders of their own, so the customer's "total orders" figure
   * reads zero for them and says nothing. What their profile should show is
   * work done, which lives in the actions they recorded against orders.
   */
  async getCompletedTaskCount(staff: User): Promise<number> {
    const result = await OrderAction.query()
      .where('staff_id', staff.id)
      .whereIn('name', COMPLETED_TASK_ACTIONS)
      .count('* as total')

    return Number(result[0].$extras.total)
  }

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
    const isCurrentPasswordCorrect = await user.verifyPassword(data.currentPassword)

    if (!isCurrentPasswordCorrect) {
      throw new errors.E_VALIDATION_ERROR([
        {
          field: 'currentPassword',
          message: 'Kata sandi saat ini salah',
        },
      ])
    }

    return user.merge({ password: data.password }).save()
  }

  /**
   * Change the user's name.
   */
  async changeName(data: ChangeNameData, user: User): Promise<User> {
    return user.merge({ name: data.name }).save()
  }

  /**
   * Starts a phone number change by sending a signed verification link to
   * the new number over WhatsApp. The number is only swapped once that link
   * is opened, which proves the customer actually owns it.
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

    /**
     * Each role verifies on its own route: role middleware would bounce a staff
     * member off the customer route, so the link has to match who asked for it.
     *
     * The account id is signed into the link alongside the number. Without it
     * the link says only "change some phone number to this one", and whoever
     * happens to be signed in when it is opened is the account that changes —
     * so a link sent to one person, opened on a shared machine or forwarded to
     * a colleague, would quietly move somebody else's number. Signed in, it
     * says whose request this is, and the route refuses anyone else.
     */
    const verificationUrl = signedUrlFor(
      PHONE_VERIFICATION_ROUTE[user.role as Role],
      {},
      {
        qs: {
          phone: data.phone,
          userId: user.id,
        },
        expiresIn: '15m',
        prefixUrl: appUrl,
      }
    )

    await this.fonnteService.sendVerificationLink(data.phone, verificationUrl)
  }

  /**
   * Applies a phone number change once the verification link has been opened.
   *
   * The number is checked again here, not only when the link was requested.
   * Fifteen minutes pass between the two, and somebody else can register that
   * number in the meantime — at which point the unique index would answer with
   * a 500 and a customer who did everything right would be looking at a crash
   * page. This turns that race into the sentence it actually is.
   */
  async verifyPhoneChange(phone: string, user: User): Promise<User> {
    if (phone === user.phone) {
      return user
    }

    const taken = await User.query().where('phone', phone).whereNot('id', user.id).first()

    if (taken) {
      throw new errors.E_VALIDATION_ERROR([
        {
          field: 'phone',
          message: 'Nomor telepon tersebut sudah digunakan akun lain. Silakan ajukan ulang.',
        },
      ])
    }

    return user.merge({ phone }).save()
  }

  /**
   * Whether a verification link belongs to the person who opened it.
   *
   * The signature proves the link came from us and has not been edited; it
   * says nothing about who is holding it. This is the part that does.
   */
  ownsPhoneChangeRequest(user: User, requestedUserId: unknown): boolean {
    return Number(requestedUserId) === user.id
  }
}
