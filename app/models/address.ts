import { AddressSchema } from '#database/schema'
import Tables from '#enums/table_enum'
import { belongsTo, hasMany } from '@adonisjs/lucid/orm'
import type { BelongsTo, HasMany } from '@adonisjs/lucid/types/relations'
import Order from './order.ts'
import User from './user.ts'

export default class Address extends AddressSchema {
  static table = Tables.ADDRESSES

  @belongsTo(() => User, {
    foreignKey: 'userId',
  })
  declare user: BelongsTo<typeof User>

  @hasMany(() => Order, {
    foreignKey: 'addressId',
  })
  declare orders: HasMany<typeof Order>

  public static async validateRadius(latitude: number, longitude: number) {
    try {
      const LATITUDE = -6.9555305
      const LONGITUDE = 107.6540353

      const limits = {
        north: 30,
        south: 10,
        east: 30,
        west: 20,
      }

      const result = this.checkDirectionalLimits(LATITUDE, LONGITUDE, latitude, longitude, limits)

      return result.isWithinArea
    } catch (error) {
      throw new Error('Gagal memvalidasi radius order')
    }
  }

  private static checkDirectionalLimits(
    centerLat: number,
    centerLng: number,
    targetLat: number,
    targetLng: number,
    limits: { north: number; south: number; east: number; west: number }
  ) {
    const latDiff = targetLat - centerLat
    const lngDiff = targetLng - centerLng

    let direction: string

    if (Math.abs(latDiff) > Math.abs(lngDiff)) {
      if (latDiff > 0) {
        direction = 'north'
      } else {
        direction = 'south'
      }
    } else {
      if (lngDiff > 0) {
        direction = 'east'
      } else {
        direction = 'west'
      }
    }

    const totalDistance = this.calculateDistance(centerLat, centerLng, targetLat, targetLng)
    const maxAllowedDistance = this.calculateMaxAllowedDistance(latDiff, lngDiff, limits)

    const isWithinArea = totalDistance <= maxAllowedDistance

    return {
      direction,
      distance: totalDistance,
      limit: maxAllowedDistance,
      isWithinArea,
    }
  }

  private static calculateMaxAllowedDistance(
    latDiff: number,
    lngDiff: number,
    limits: { north: number; south: number; east: number; west: number }
  ) {
    const totalLatDiff = Math.abs(latDiff)
    const totalLngDiff = Math.abs(lngDiff)
    const totalDiff = totalLatDiff + totalLngDiff

    if (totalDiff === 0) return Math.max(...Object.values(limits))

    const latRatio = totalLatDiff / totalDiff
    const lngRatio = totalLngDiff / totalDiff

    const verticalLimit = latDiff >= 0 ? limits.north : limits.south
    const horizontalLimit = lngDiff >= 0 ? limits.east : limits.west

    const maxDistance = Math.sqrt(
      Math.pow(verticalLimit * latRatio, 2) + Math.pow(horizontalLimit * lngRatio, 2)
    )

    return maxDistance
  }

  private static calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
    const R = 6371
    const dLat = this.toRadians(lat2 - lat1)
    const dLon = this.toRadians(lon2 - lon1)

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRadians(lat1)) *
        Math.cos(this.toRadians(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2)

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    const distance = R * c

    return Math.round(distance * 100) / 100
  }

  private static toRadians(degrees: number) {
    return degrees * (Math.PI / 180)
  }
}
