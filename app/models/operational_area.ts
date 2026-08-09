import { OperationalAreaSchema } from '#database/schema'
import type { PolygonGeometry } from '#utils/geo'
import { scope } from '@adonisjs/lucid/orm'
import db from '@adonisjs/lucid/services/db'

export default class OperationalArea extends OperationalAreaSchema {
  static withGeometry = scope((query) => {
    query
      .select('id', 'name', 'is_active', 'created_at', 'updated_at')
      .select(db.raw('ST_AsGeoJSON(geometry)::json as geometry'))
  })

  get geometry(): PolygonGeometry | null {
    return this.$extras.geometry ?? null
  }
}
