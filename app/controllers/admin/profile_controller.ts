import type { HttpContext } from '@adonisjs/core/http'
import { inject } from '@adonisjs/core'
import { changePasswordValidator } from '#validators/profile_validator'
import ProfileService from '#services/profile_service'
import DashboardService from '#services/dashboard_service'

@inject()
export default class ProfileController {
  constructor(
    protected profileService: ProfileService,
    protected dashboardService: DashboardService
  ) {}

  /**
   * An admin places no orders, so the customer's "total orders" figure would
   * always read zero here and say nothing. What an admin's profile can
   * usefully show is the shop they are responsible for: how large the team is
   * and how many payments have settled.
   */
  async show({ inertia }: HttpContext) {
    const [teamSize, transactions] = await Promise.all([
      this.dashboardService.getTeamSize(),
      this.dashboardService.getTransactionCount(),
    ])

    return inertia.render('admin/profile/show', {
      teamSize,
      transactions,
    })
  }

  async update({ auth, request, response, session }: HttpContext) {
    const user = auth.getUserOrFail()
    const payload = await request.validateUsing(changePasswordValidator)

    await this.profileService.changePassword(payload, user)
    session.flash('success', 'Kata sandi berhasil diperbarui')

    return response.redirect().toRoute('admin.profile.show')
  }
}
