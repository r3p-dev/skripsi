import AuthService from '#services/auth_service'
import type { HttpContext } from '@adonisjs/core/http'
import { inject } from '@adonisjs/core'
import { changePasswordValidator } from '#validators/auth_validator'
import { type PageObject } from '@adonisjs/inertia/types'
import { OrderStatus } from '#enums/order_status_enum'

/**
 * Expose profile endpoints for the authenticated user.
 */
@inject()
export default class ProfileController {
  constructor(protected authService: AuthService) {}

  /**
   * Return the current authenticated user from the session.
   */
  async show({ auth, inertia }: HttpContext): Promise<string | PageObject<{}>> {
    const user = auth.getUserOrFail()

    await user.loadCount('orders', (query) => {
      query.where('status', OrderStatus.COMPLETED)
    })

    return inertia.render('customer/profile', {
      totalOrders: user.$extras.orders_count,
    })
  }

  /**
   * Change password for the current authenticated user.
   */
  async update({ auth, request, response }: HttpContext): Promise<void> {
    const user = auth.getUserOrFail()
    const payload = await request.validateUsing(changePasswordValidator)

    await this.authService.changePassword(payload, user)

    return response.redirect().toRoute('customer.profile.show')
  }
}
