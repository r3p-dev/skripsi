import AddressService from '#services/address_service'
import AddressTransformer from '#transformers/address_transformer'
import { addressValidator } from '#validators/profile_validator'
import type { HttpContext } from '@adonisjs/core/http'
import { inject } from '@adonisjs/core'
import { type PageObject } from '@adonisjs/inertia/types'

/**
 * Manage the authenticated customer's active address.
 */
@inject()
export default class AddressController {
  constructor(protected addressService: AddressService) {}

  /**
   * Display the authenticated customer's active address.
   */
  async show({ auth, inertia }: HttpContext): Promise<string | PageObject<{}>> {
    const user = auth.getUserOrFail()
    const address = await this.addressService.getActiveAddress(user)

    return inertia.render('customer/address/show', {
      address: AddressTransformer.transform(address),
    })
  }

  /**
   * Display the new address form.
   */
  async create({ auth, inertia }: HttpContext): Promise<string | PageObject<{}>> {
    const user = auth.getUserOrFail()
    const address = await this.addressService.getActiveAddress(user)

    return inertia.render('customer/address/form', {
      address: AddressTransformer.transform(address),
    })
  }

  /**
   * Create the customer's current active address.
   */
  async store({ auth, request, response }: HttpContext) {
    const payload = await request.validateUsing(addressValidator)
    const user = auth.getUserOrFail()

    await this.addressService.replaceActiveAddress(user, payload)

    return response.redirect().toRoute('customer.address.show')
  }
}
