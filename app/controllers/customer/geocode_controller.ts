import AddressService from '#services/address_service'
import GeocodingService from '#services/geocoding_service'
import NearbyService from '#services/nearby_service'
import { geocodeValidator, nearbyValidator } from '#validators/geocode_validator'
import type { HttpContext } from '@adonisjs/core/http'
import { inject } from '@adonisjs/core'

@inject()
export default class GeocodeController {
  constructor(
    protected geocodingService: GeocodingService,
    protected nearbyService: NearbyService,
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
        return response.json({ results: [], reason: 'not_found' })
      }

      const results = await this.addressService.filterWithinOperationalArea(candidates)

      if (results.length === 0) {
        return response.json({ results: [], reason: 'outside_area' })
      }

      return response.json({ results, reason: null })
    } catch {
      return response.serviceUnavailable({ results: [], reason: 'unavailable' })
    }
  }

  async nearby({ request, response }: HttpContext) {
    const { latitude, longitude } = await request.validateUsing(nearbyValidator, {
      data: request.qs(),
    })

    try {
      const places = await this.nearbyService.search(latitude, longitude)

      return response.json({ places })
    } catch {
      return response.serviceUnavailable({ places: [] })
    }
  }
}
