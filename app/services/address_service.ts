import Address from '#models/address'
import Order from '#models/order'
import type User from '#models/user'
import type { AddressData } from '#validators/address_validator'
import { inject } from '@adonisjs/core'
import db from '@adonisjs/lucid/services/db'
import { errors } from '@vinejs/vine'
import RouteService from '#services/route_service'
import { shop } from '#config/shop'
import type { TransactionClientContract } from '@adonisjs/lucid/types/database'

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
   * Replaces the customer's active address, keeping the one it replaced only
   * for as long as something still refers to it.
   *
   * An address that has priced or routed an order is history — the record of
   * where those shoes were collected from — and is retired rather than
   * removed. One that never did is simply a typo the customer corrected a
   * minute later, and keeping it means the shop accumulates a pile of
   * addresses nobody has ever been to and nothing will ever point at.
   *
   * All of it runs in one transaction, so only ever one address is active.
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
      const currentAddress = await Address.query({ client: trx })
        .where('user_id', user.id)
        .andWhere('is_active', true)
        .first()

      if (currentAddress) {
        if (await this.isReferencedByOrder(currentAddress, trx)) {
          await currentAddress.merge({ isActive: false }).useTransaction(trx).save()
        } else {
          await currentAddress.useTransaction(trx).delete()
        }
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
   * Whether any order still points at this address.
   *
   * The foreign key from `orders` restricts the delete anyway, so this is what
   * keeps the tidy-up from turning into a database error on the one address
   * that genuinely matters.
   */
  private async isReferencedByOrder(
    address: Address,
    trx?: TransactionClientContract
  ): Promise<boolean> {
    const result = await Order.query(trx ? { client: trx } : {})
      .where('address_id', address.id)
      .count('* as total')

    return Number(result[0].$extras.total) > 0
  }

  /**
   * Removes every retired address nothing points at any more.
   *
   * The replace path above keeps its own house in order, so this is for the
   * ones that accumulated before it did — and for the case where an order that
   * was holding an address alive is itself deleted later. Active addresses are
   * never touched: an address a customer is currently using is not orphaned
   * just because they have not ordered yet.
   */
  async deleteOrphanedAddresses(): Promise<number> {
    const orphans = await Address.query()
      .where('is_active', false)
      .whereDoesntHave('orders', (query) => query)

    for (const orphan of orphans) {
      await orphan.delete()
    }

    return orphans.length
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
    const latitudeOffset = latitude - shop.latitude
    const longitudeOffset = longitude - shop.longitude
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
      shop.latitude,
      shop.longitude,
      latitude,
      longitude
    )

    return distanceKm <= maxAllowedDistanceKm
  }
}
