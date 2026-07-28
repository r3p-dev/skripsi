import type { HttpContext } from '@adonisjs/core/http'
import { inject } from '@adonisjs/core'
import { changePasswordValidator } from '#validators/profile_validator'
import ProfileService from '#services/profile_service'

@inject()
export default class ProfileController {
  constructor(protected profileService: ProfileService) {}

  async show({ auth, inertia }: HttpContext) {
    const staff = auth.getUserOrFail()

    return inertia.render('staff/profile/show', {
      totalTasks: await this.profileService.getCompletedTaskCount(staff),
    })
  }

  async update({ auth, request, response, session }: HttpContext) {
    const user = auth.getUserOrFail()
    const payload = await request.validateUsing(changePasswordValidator)

    await this.profileService.changePassword(payload, user)
    session.flash('success', 'Kata sandi berhasil diperbarui')

    return response.redirect().toRoute('staff.profile.show')
  }
}
