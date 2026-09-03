import type { HttpContext } from '@adonisjs/core/http'
import { inject } from '@adonisjs/core'
import { changeNameValidator } from '#validators/profile_validator'
import CustomerProfileService from '#services/customer_profile_service'
import AddressTransformer from '#transformers/address_transformer'
import AddressService from '#services/address_service'

@inject()
export default class ProfileController {
  constructor(
    protected profileService: CustomerProfileService,
    protected addressService: AddressService
  ) {}

  async show({ auth, inertia }: HttpContext) {
    const user = auth.getUserOrFail()

    const address = await this.addressService.getActiveAddress(user)

    return inertia.render('customer/profile/show', {
      address: AddressTransformer.transform(address),
    })
  }

  async update({ auth, request, response, session }: HttpContext) {
    const user = auth.getUserOrFail()

    const payload = await request.validateUsing(changeNameValidator)

    await this.profileService.changeName(payload, user)

    session.flash('success', 'Nama berhasil diperbarui')
    return response.redirect().toRoute('customer.profile.show')
  }
}
