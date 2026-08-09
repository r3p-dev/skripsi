import { BaseSeeder } from '@adonisjs/lucid/seeders'
import type { FeatureCollection, PolygonGeometry } from '#utils/geo'
import app from '@adonisjs/core/services/app'
import db from '@adonisjs/lucid/services/db'
import { readFile } from 'node:fs/promises'

const SOURCE = 'database/data/operational_areas.geojson'

export default class extends BaseSeeder {
  async run() {
    const areas = await this.#readAreas()

    for (const [name, geometry] of areas) {
      await db
        .insertQuery()
        .table('operational_areas')
        .insert({
          name,
          geometry: db.raw('ST_SetSRID(ST_Force2D(ST_GeomFromGeoJSON(?)), 4326)', [
            JSON.stringify(geometry),
          ]),
          is_active: true,
          created_at: new Date(),
          updated_at: new Date(),
        })
        .onConflict('name')
        .merge(['geometry', 'updated_at'])
    }
  }

  async #readAreas(): Promise<[name: string, geometry: PolygonGeometry][]> {
    const contents = await readFile(app.makePath(SOURCE), 'utf-8')
    const collection = JSON.parse(contents) as FeatureCollection

    return collection.features
      .filter((feature) => feature.geometry.type === 'Polygon')
      .map((feature, index) => [feature.properties?.Name ?? `Area ${index + 1}`, feature.geometry])
  }
}
