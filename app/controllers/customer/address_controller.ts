import AddressService from '#services/address_service'
import AddressTransformer from '#transformers/address_transformer'
import { addressValidator } from '#validators/address_validator'
import type { HttpContext } from '@adonisjs/core/http'
import { inject } from '@adonisjs/core'

@inject()
export default class AddressController {
  constructor(protected addressService: AddressService) {}

  async show({ auth, inertia }: HttpContext) {
    const user = auth.getUserOrFail()
    const address = await this.addressService.getActiveAddress(user)

    return inertia.render('customer/address/show', {
      address: AddressTransformer.transform(address),
    })
  }

  async create({ auth, inertia }: HttpContext) {
    const user = auth.getUserOrFail()
    const address = await this.addressService.getActiveAddress(user)

    return inertia.render('customer/address/create', {
      address: AddressTransformer.transform(address),
    })
  }

  async store({ auth, request, response, session }: HttpContext) {
    const payload = await request.validateUsing(addressValidator)
    const user = auth.getUserOrFail()

    await this.addressService.replaceActiveAddress(user, payload)

    session.flash('success', 'Berhasil menambahkan alamat.')
    return response.redirect().toRoute('customer.address.show')
  }
}
