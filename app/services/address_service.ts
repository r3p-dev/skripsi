import Address from '#models/address'
import type User from '#models/user'
import type { AddressData } from '#validators/address_validator'
import { inject } from '@adonisjs/core'
import db from '@adonisjs/lucid/services/db'
import { errors } from '@vinejs/vine'
import RouteService from '#services/route_service'

/**
 * Coordinates of the service center, used as the origin
 * when measuring how far away an address is.
 */
const SERVICE_CENTER_LATITUDE = -6.9555305
const SERVICE_CENTER_LONGITUDE = 107.6540353

/**
 * Maximum distance in kilometres the team travels in each direction.
 * The limits are deliberately asymmetric: coverage reaches much further
 * north and east than south and west.
 */
const DIRECTIONAL_LIMITS_KM = {
  north: 30,
  south: 10,
  east: 30,
  west: 20,
}

/**
 * Manages customer addresses and validates whether a location
 * is within the supported service area.
 */
@inject()
export default class AddressService {
  constructor(private routeService: RouteService) {}

  async getActiveAddress(user: User): Promise<Address | null> {
    return Address.query().where('user_id', user.id).andWhere('is_active', true).first()
  }

  /**
   * Replaces the customer's active address while preserving previous
   * addresses for historical purposes, such as completed orders.
   *
   * The update is executed within a database transaction to ensure
   * only one address remains active.
   */
  async replaceActiveAddress(user: User, data: AddressData): Promise<Address> {
    const isValid = this.validateRadius(data.latitude, data.longitude)
    if (!isValid) {
      throw new errors.E_VALIDATION_ERROR([
        {
          field: 'radius',
          message: 'Alamat Anda tidak berada dalam area layanan. Silakan pilih lokasi lain.',
        },
      ])
    }

    return db.transaction(async (trx) => {
      const currentAddress = await Address.query()
        .where('user_id', user.id)
        .andWhere('is_active', true)
        .first()

      if (currentAddress) {
        await currentAddress.merge({ isActive: false }).useTransaction(trx).save()
      }

      return Address.create(
        {
          ...data,
          userId: user.id,
          isActive: true,
        },
        { client: trx }
      )
    })
  }

  /**
   * Checks whether a location falls within the supported service area.
   *
   * The area is not a plain circle: the allowed distance is blended from
   * the two directional limits the location sits between, weighted by how
   * much of its offset is vertical versus horizontal. An address due north
   * therefore gets the full northern limit, while a north-east address gets
   * something in between the northern and eastern limits.
   */
  validateRadius(latitude: number, longitude: number): boolean {
    const latitudeOffset = latitude - SERVICE_CENTER_LATITUDE
    const longitudeOffset = longitude - SERVICE_CENTER_LONGITUDE
    const totalOffset = Math.abs(latitudeOffset) + Math.abs(longitudeOffset)

    // The service center itself is always inside the area.
    if (totalOffset === 0) {
      return true
    }

    const verticalWeight = Math.abs(latitudeOffset) / totalOffset
    const horizontalWeight = Math.abs(longitudeOffset) / totalOffset

    const verticalLimit =
      latitudeOffset >= 0 ? DIRECTIONAL_LIMITS_KM.north : DIRECTIONAL_LIMITS_KM.south
    const horizontalLimit =
      longitudeOffset >= 0 ? DIRECTIONAL_LIMITS_KM.east : DIRECTIONAL_LIMITS_KM.west

    const maxAllowedDistanceKm = Math.sqrt(
      (verticalLimit * verticalWeight) ** 2 + (horizontalLimit * horizontalWeight) ** 2
    )

    const distanceKm = this.routeService.calculateDistanceInKm(
      SERVICE_CENTER_LATITUDE,
      SERVICE_CENTER_LONGITUDE,
      latitude,
      longitude
    )

    return distanceKm <= maxAllowedDistanceKm
  }
}
