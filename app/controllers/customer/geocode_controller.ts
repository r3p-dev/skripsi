import AddressService from '#services/address_service'
import GeocodingService from '#services/geocoding_service'
import { geocodeValidator } from '#validators/geocode_validator'
import type { HttpContext } from '@adonisjs/core/http'
import { inject } from '@adonisjs/core'

@inject()
export default class GeocodeController {
  constructor(
    protected geocodingService: GeocodingService,
    protected addressService: AddressService
  ) {}

  async show({ request, response }: HttpContext) {
    const { query } = await request.validateUsing(geocodeValidator, {
      data: request.qs(),
    })

    try {
      const bounds = await this.addressService.getOperationalAreaBounds()
      const candidates = await this.geocodingService.search(query, bounds)

      if (candidates.length === 0) {
        return response.json({ result: null, reason: 'not_found' })
      }

      const match = await this.addressService.findFirstWithinOperationalArea(candidates)

      if (!match) {
        return response.json({ result: null, reason: 'outside_area' })
      }

      return response.json({ result: match, reason: null })
    } catch {
      return response.serviceUnavailable({ result: null, reason: 'unavailable' })
    }
  }
}
