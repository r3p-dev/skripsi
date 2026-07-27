import Address from '#models/address'
import type User from '#models/user'
import type { AddressData } from '#validators/address_validator'
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
 * Manages customer addresses and validates whether a location
 * is within the supported service area.
 */
@inject()
export default class AddressService {
  constructor(private service: RouteService) {}

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
   * Validates whether a location falls within the configured service area.
   *
   * The service area is asymmetric, allowing different maximum distances
   * for the north, south, east, and west directions.
   */
  validateRadius(latitude: number, longitude: number): boolean {
    try {
      const LATITUDE = -6.9555305
      const LONGITUDE = 107.6540353

      const limits: DirectionalLimits = {
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
   * Compares the actual distance with the maximum distance allowed
   * for the target direction.
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

    const totalDistance = this.service.calculateDistanceInKm(
      centerLat,
      centerLng,
      targetLat,
      targetLng
    )
    const maxAllowedDistance = this.calculateMaxAllowedDistance(latDiff, lngDiff, limits)

    return totalDistance <= maxAllowedDistance
  }

  /**
   * Calculates the maximum allowed distance by blending the directional
   * limits based on the target's latitude and longitude offsets.
   *
   * This produces an asymmetric service area instead of a simple
   * circular radius.
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
