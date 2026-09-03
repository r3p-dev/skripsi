import Address from '#models/address'
import OperationalArea from '#models/operational_area'
import Order from '#models/order'
import type User from '#models/user'
import type { AddressData } from '#validators/address_validator'
import { errors } from '@vinejs/vine'
import { inject } from '@adonisjs/core'
import db from '@adonisjs/lucid/services/db'
import type { TransactionClientContract } from '@adonisjs/lucid/types/database'

export type AreaBounds = {
  minLongitude: number
  minLatitude: number
  maxLongitude: number
  maxLatitude: number
}

@inject()
export default class AddressService {
  async getActiveAddress(user: User, trx?: TransactionClientContract): Promise<Address | null> {
    return Address.query({ client: trx })
      .where('user_id', user.id)
      .andWhere('is_active', true)
      .first()
  }

  async getOperationalAreas(): Promise<OperationalArea[]> {
    return OperationalArea.query()
      .where('is_active', true)
      .withScopes((scopes) => scopes.withGeometry())
  }

  async getOperationalAreaBounds(): Promise<AreaBounds | null> {
    const result = await db
      .from('operational_areas')
      .where('is_active', true)
      .select(
        db.raw('ST_XMin(ST_Extent(geometry)) as min_longitude'),
        db.raw('ST_YMin(ST_Extent(geometry)) as min_latitude'),
        db.raw('ST_XMax(ST_Extent(geometry)) as max_longitude'),
        db.raw('ST_YMax(ST_Extent(geometry)) as max_latitude')
      )
      .first()

    if (!result || result.min_longitude === null) {
      return null
    }

    return {
      minLongitude: Number(result.min_longitude),
      minLatitude: Number(result.min_latitude),
      maxLongitude: Number(result.max_longitude),
      maxLatitude: Number(result.max_latitude),
    }
  }

  async getOperationalAreaCentroid(): Promise<{ latitude: number; longitude: number } | null> {
    const result = await db
      .from('operational_areas')
      .where('is_active', true)
      .select(
        db.raw('ST_Y(ST_Centroid(ST_Collect(geometry))) as latitude'),
        db.raw('ST_X(ST_Centroid(ST_Collect(geometry))) as longitude')
      )
      .first()

    if (!result || result.latitude === null) {
      return null
    }

    return {
      latitude: Number(result.latitude),
      longitude: Number(result.longitude),
    }
  }

  async filterWithinOperationalArea<T extends { latitude: number; longitude: number }>(
    candidates: T[]
  ): Promise<T[]> {
    if (candidates.length === 0) {
      return []
    }

    const tuples = candidates.map(() => '(?::int, ?::float8, ?::float8)').join(', ')
    const bindings = candidates.flatMap((candidate, index) => [
      index,
      candidate.longitude,
      candidate.latitude,
    ])

    const result = await db.rawQuery(
      `SELECT candidate.idx
         FROM (VALUES ${tuples}) AS candidate (idx, longitude, latitude)
        WHERE EXISTS (
          SELECT 1
            FROM operational_areas
           WHERE is_active = true
             AND ST_Covers(
                   geometry,
                   ST_SetSRID(ST_MakePoint(candidate.longitude, candidate.latitude), 4326)
                 )
        )`,
      bindings
    )

    const inside = new Set<number>(result.rows.map((row: { idx: number }) => Number(row.idx)))

    return candidates.filter((_, index) => inside.has(index))
  }

  async replaceActiveAddress(user: User, data: AddressData): Promise<Address> {
    if (!(await this.#isWithinOperationalArea(data.longitude, data.latitude))) {
      throw new errors.E_VALIDATION_ERROR([
        {
          field: 'location',
          message: 'Lokasi tersebut berada di luar jangkauan layanan jemput-antar kami.',
        },
      ])
    }

    return db.transaction(async (trx) => {
      await this.#removeCurrentAddress(user, trx)

      return Address.create(
        {
          ...data,
          userId: user.id,
          isActive: true,
          longitude: data.longitude.toString(),
          latitude: data.latitude.toString(),
        },
        { client: trx }
      )
    })
  }

  async #isWithinOperationalArea(longitude: number, latitude: number): Promise<boolean> {
    const area = await OperationalArea.query()
      .where('is_active', true)
      .whereRaw('ST_Covers(geometry, ST_SetSRID(ST_MakePoint(?, ?), 4326))', [longitude, latitude])
      .select('id')
      .first()

    return area !== null
  }

  async #removeCurrentAddress(user: User, trx: TransactionClientContract): Promise<void> {
    const currentAddress = await this.getActiveAddress(user, trx)

    if (!currentAddress) {
      return
    }

    if (await this.#isReferencedByOrder(currentAddress, trx)) {
      await currentAddress.merge({ isActive: false }).useTransaction(trx).save()

      return
    }

    await currentAddress.useTransaction(trx).delete()
  }

  async #isReferencedByOrder(address: Address, trx?: TransactionClientContract): Promise<boolean> {
    const result = await Order.query(trx ? { client: trx } : {})
      .where('address_id', address.id)
      .count('* as total')

    return Number(result[0].$extras.total) > 0
  }

  async deleteOrphanedAddresses(): Promise<number> {
    const deleted = await Address.query()
      .where('is_active', false)
      .whereDoesntHave('orders', (query) => query)
      .delete()

    return Number(deleted[0] ?? 0)
  }
}
