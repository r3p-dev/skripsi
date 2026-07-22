import Address from '#models/address'
import type User from '#models/user'
import type { AddressData } from '#validators/profile_validator'
import { inject } from '@adonisjs/core'
import db from '@adonisjs/lucid/services/db'
import { errors } from '@vinejs/vine'
import RouteService from '#services/route_service'

/**
 * Directional service radius limits measured from the service center.
 */
type DirectionalLimits = {
  north: number
  south: number
  east: number
  west: number
}

/**
 * Provides address management and service-area validation for customers.
 *
 * Responsibilities:
 * - Retrieve the customer's active address.
 * - Replace the active address while preserving address history.
 * - Validate whether a location falls within the supported delivery area.
 */
@inject()
export default class AddressService {
  constructor(private routeService: RouteService) {}

  /**
   * Retrieve the customer's currently active address.
   *
   * @param user - Authenticated customer.
   * @returns The active address associated with the customer, or `null`
   * if no active address exists.
   */
  async getActiveAddress(user: User): Promise<Address | null> {
    return Address.query().where('user_id', user.id).andWhere('is_active', true).first()
  }

  /**
   * Replace the customer's active address with a newly created address.
   *
   * The operation is executed within a database transaction to ensure
   * consistency. Any previously active address is marked as inactive before
   * the new address is created.
   *
   * Existing addresses are retained for historical purposes, such as
   * preserving delivery information associated with past orders.
   *
   * @param user - Authenticated customer.
   * @param data - Validated address payload.
   * @returns The newly created active address.
   * @throws {errors.E_VALIDATION_ERROR}
   * Thrown when the provided coordinates fall outside the supported
   * service area.
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
      const address = await Address.query()
        .where('user_id', user.id)
        .andWhere('is_active', true)
        .first()
      if (address) {
        await address
          .merge({
            isActive: false,
          })
          .useTransaction(trx)
          .save()
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
   * Determine whether a location is within the supported service area.
   *
   * The validation uses directional distance limits measured from a fixed
   * service center. Different maximum distances can be applied for the
   * north, south, east, and west directions.
   *
   * @param latitude - Target latitude.
   * @param longitude - Target longitude.
   * @returns `true` when the coordinates are within the supported area;
   * otherwise `false`.
   * @throws {Error}
   * Thrown when an unexpected error occurs during validation.
   */
  validateRadius(latitude: number, longitude: number): boolean {
    try {
      const LATITUDE = -6.9555305
      const LONGITUDE = 107.6540353

      const limits = {
        north: 30,
        south: 10,
        east: 30,
        west: 20,
      }

      return this.checkDirectionalLimits(LATITUDE, LONGITUDE, latitude, longitude, limits)
    } catch (error) {
      throw new Error('Gagal memvalidasi radius order')
    }
  }

  /**
   * Compare a target location against directional distance limits.
   *
   * This method calculates:
   * 1. The actual distance between the service center and target location.
   * 2. The maximum allowed distance based on the target direction.
   *
   * @param centerLat - Service center latitude.
   * @param centerLng - Service center longitude.
   * @param targetLat - Target latitude.
   * @param targetLng - Target longitude.
   * @param limits - Directional service radius limits in kilometers.
   * @returns `true` if the target location is within the allowed distance;
   * otherwise `false`.
   * @private
   */
  private checkDirectionalLimits(
    centerLat: number,
    centerLng: number,
    targetLat: number,
    targetLng: number,
    limits: DirectionalLimits
  ): boolean {
    const latDiff = targetLat - centerLat
    const lngDiff = targetLng - centerLng

    const totalDistance = this.routeService.calculateDistanceInKm(
      centerLat,
      centerLng,
      targetLat,
      targetLng
    )
    const maxAllowedDistance = this.calculateMaxAllowedDistance(latDiff, lngDiff, limits)

    return totalDistance <= maxAllowedDistance
  }

  /**
   * Calculate the maximum allowed distance based on the target direction.
   *
   * The directional limits are blended proportionally according to the
   * latitude and longitude offsets. This allows the service area to form
   * an asymmetric radius rather than a perfect circle.
   *
   * @param latDiff - Latitude difference from center to target.
   * @param lngDiff - Longitude difference from center to target.
   * @param limits - Directional service radius limits in kilometers.
   * @returns Maximum permitted distance in kilometers.
   * @private
   */
  private calculateMaxAllowedDistance(
    latDiff: number,
    lngDiff: number,
    limits: DirectionalLimits
  ): number {
    const totalLatDiff = Math.abs(latDiff)
    const totalLngDiff = Math.abs(lngDiff)
    const totalDiff = totalLatDiff + totalLngDiff

    if (totalDiff === 0) return Math.max(...Object.values(limits))

    const latRatio = totalLatDiff / totalDiff
    const lngRatio = totalLngDiff / totalDiff

    const verticalLimit = latDiff >= 0 ? limits.north : limits.south
    const horizontalLimit = lngDiff >= 0 ? limits.east : limits.west

    return Math.sqrt(
      Math.pow(verticalLimit * latRatio, 2) + Math.pow(horizontalLimit * lngRatio, 2)
    )
  }
}
