import type { PolygonGeometry } from '#utils/geo'
import db from '@adonisjs/lucid/services/db'
import { nextSequence } from '#database/factories/support'

export const AREA_CENTER = { latitude: -6.9555305, longitude: 107.6540353 }

export const OUTSIDE_AREA = { latitude: -8.65, longitude: 115.216 }

const DEFAULT_HALF_SIZE = 0.05

export function boxAround(
  center: { latitude: number; longitude: number } = AREA_CENTER,
  halfSize: number = DEFAULT_HALF_SIZE
): PolygonGeometry {
  const { latitude, longitude } = center

  return {
    type: 'Polygon',
    coordinates: [
      [
        [longitude - halfSize, latitude - halfSize],
        [longitude + halfSize, latitude - halfSize],
        [longitude + halfSize, latitude + halfSize],
        [longitude - halfSize, latitude + halfSize],
        [longitude - halfSize, latitude - halfSize],
      ],
    ],
  }
}

export async function createOperationalArea(
  options: {
    name?: string
    center?: { latitude: number; longitude: number }
    halfSize?: number
    isActive?: boolean
  } = {}
): Promise<{ id: number; geometry: PolygonGeometry }> {
  const geometry = boxAround(options.center ?? AREA_CENTER, options.halfSize)

  const [row] = await db
    .table('operational_areas')
    .returning('id')
    .insert({
      name: options.name ?? `Area Uji ${nextSequence()}`,
      geometry: db.raw('ST_SetSRID(ST_GeomFromGeoJSON(?), 4326)', [JSON.stringify(geometry)]),
      is_active: options.isActive ?? true,
      created_at: new Date(),
      updated_at: new Date(),
    })

  return { id: Number(row.id ?? row), geometry }
}
