import Address from '#models/address'
import AddressTransformer from '#transformers/address_transformer'
import { addressValidator } from '#validators/profile_validator'
import type { HttpContext } from '@adonisjs/core/http'
import { errors } from '@vinejs/vine'

export default class AddressController {
  async create({ inertia }: HttpContext) {
    return inertia.render('customer/address/create', {
      address: null,
    })
  }

  async show({ inertia, auth }: HttpContext) {
    const user = auth.getUserOrFail()

    const address = await user.related('addresses').query().where('is_active', true).first()

    return inertia.render('customer/address/show', {
      address: AddressTransformer.transform(address),
    })
  }

  async update({ request, response, auth }: HttpContext) {
    const user = auth.getUserOrFail()
    const payload = await request.validateUsing(addressValidator)

    const isWithinArea = await Address.validateRadius(payload.latitude, payload.longitude)
    if (!isWithinArea) {
      throw new errors.E_VALIDATION_ERROR([
        {
          field: 'radius',
          message: 'Alamat Anda tidak berada dalam area layanan. Silakan pilih lokasi lain.',
        },
      ])
    }

    const currentActiveAddress = await user
      .related('addresses')
      .query()
      .where('is_active', true)
      .first()
    if (currentActiveAddress) {
      await currentActiveAddress.merge({ isActive: false }).save()
    }

    await user.related('addresses').create(payload)

    return response.redirect().back()
  }
}
