import type { HttpContext } from '@adonisjs/core/http'
import { inject } from '@adonisjs/core'
import { changePasswordValidator } from '#validators/profile_validator'
import { OrderStatus } from '#enums/order_status_enum'
import ProfileService from '#services/profile_service'

@inject()
export default class ProfileController {
  constructor(protected service: ProfileService) {}

  async show({ auth, inertia }: HttpContext) {
    const user = auth.getUserOrFail()

    await user.loadCount('orders', (query) => {
      query.where('status', OrderStatus.COMPLETED)
    })

    return inertia.render('staff/profile/show', {
      totalOrders: user.$extras.orders_count,
    })
  }

  async edit({ inertia }: HttpContext) {
    return inertia.render('staff/profile/edit', {})
  }

  async update({ auth, request, response, session }: HttpContext) {
    const user = auth.getUserOrFail()
    const payload = await request.validateUsing(changePasswordValidator)

    await this.service.changePassword(payload, user)
    session.flash('success', 'Kata sandi berhasil diperbarui')

    return response.redirect().toRoute('staff.profile.show')
  }
}
