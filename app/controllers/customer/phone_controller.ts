import ProfileService from '#services/profile_service'
import type { HttpContext } from '@adonisjs/core/http'
import { inject } from '@adonisjs/core'
import { changePhoneValidator } from '#validators/profile_validator'

@inject()
export default class PhoneController {
  constructor(protected profileService: ProfileService) {}

  async store({ auth, request, response, session }: HttpContext) {
    const user = auth.getUserOrFail()
    const payload = await request.validateUsing(changePhoneValidator)

    await this.profileService.requestChangePhone(payload, user)
    session.flash('success', 'Permintaan perubahan nomor telepon berhasil dikirim')

    return response.redirect().toRoute('customer.profile.show')
  }

  async update({ auth, request, response, session, inertia }: HttpContext) {
    const user = auth.getUserOrFail()

    const phone = request.qs().phone as string
    if (!request.hasValidSignature() || !phone) {
      return inertia.render('errors/invalid_signature', {})
    }

    await this.profileService.verifyPhoneChange(phone, user)
    session.flash('success', 'Nomor telepon berhasil diverifikasi')

    return response.redirect().toRoute('customer.profile.show')
  }
}
