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

  /**
   * Applies a verified phone number change.
   *
   * The signature only proves the link is ours and unedited. Whose request it
   * is comes from the account id signed into it, which is checked against
   * whoever is actually holding the link — otherwise a link sent to one person
   * would change the number of whichever account happened to be signed in when
   * it was opened.
   */
  async update({ auth, request, response, session, inertia }: HttpContext) {
    const user = auth.getUserOrFail()

    const phone = request.qs().phone as string
    if (
      !request.hasValidSignature() ||
      !phone ||
      !this.profileService.ownsPhoneChangeRequest(user, request.qs().userId)
    ) {
      return inertia.render('errors/invalid_signature', {})
    }

    await this.profileService.verifyPhoneChange(phone, user)
    session.flash('success', 'Nomor telepon berhasil diverifikasi')

    return response.redirect().toRoute('customer.profile.show')
  }
}
