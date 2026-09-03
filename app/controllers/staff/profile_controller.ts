import type { HttpContext } from '@adonisjs/core/http'
import { inject } from '@adonisjs/core'
import { changeNameValidator } from '#validators/profile_validator'
import StaffProfileService from '#services/staff_profile_service'

@inject()
export default class ProfileController {
  constructor(protected profileService: StaffProfileService) {}

  async show({ inertia }: HttpContext) {
    return inertia.render('staff/profile/show', {})
  }

  async update({ auth, request, response, session }: HttpContext) {
    const user = auth.getUserOrFail()

    const payload = await request.validateUsing(changeNameValidator)

    await this.profileService.changeName(payload, user)

    session.flash('success', 'Nama berhasil diperbarui')
    return response.redirect().toRoute('staff.profile.show')
  }
}
