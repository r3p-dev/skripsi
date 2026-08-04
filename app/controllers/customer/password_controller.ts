import ProfileService from '#services/profile_service'
import type { HttpContext } from '@adonisjs/core/http'
import { inject } from '@adonisjs/core'
import { changePasswordValidator } from '#validators/profile_validator'

@inject()
export default class PasswordController {
  constructor(protected profileService: ProfileService) {}

  async update({ auth, request, response, session }: HttpContext) {
    const user = auth.getUserOrFail()
    const payload = await request.validateUsing(changePasswordValidator)

    await this.profileService.changePassword(payload, user)
    session.flash('success', 'Kata sandi berhasil diperbarui')

    return response.redirect().toRoute('customer.profile.show')
  }
}
