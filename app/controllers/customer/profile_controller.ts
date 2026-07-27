import ProfileService from '#services/profile_service'
import AddressService from '#services/address_service'
import AddressTransformer from '#transformers/address_transformer'
import type { HttpContext } from '@adonisjs/core/http'
import { inject } from '@adonisjs/core'
import { changeNameValidator } from '#validators/profile_validator'

@inject()
export default class ProfileController {
  constructor(
    protected service: ProfileService,
    protected addressService: AddressService
  ) {}

  async show({ auth, inertia }: HttpContext) {
    const user = auth.getUserOrFail()

    const totalOrders = await this.service.getTotalOrders(user)
    const address = await this.addressService.getActiveAddress(user)

    return inertia.render('customer/profile/show', {
      totalOrders,
      address: AddressTransformer.transform(address),
    })
  }

  async update({ auth, request, response, session }: HttpContext) {
    const user = auth.getUserOrFail()
    const payload = await request.validateUsing(changeNameValidator)

    await this.service.changeName(payload, user)
    session.flash('success', 'Nama berhasil diperbarui')

    return response.redirect().toRoute('customer.profile.show')
  }
}
