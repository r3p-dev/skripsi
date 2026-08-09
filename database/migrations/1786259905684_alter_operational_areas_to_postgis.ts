import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'operational_areas'

  async up() {
    this.schema.raw('CREATE EXTENSION IF NOT EXISTS postgis')

    this.schema.raw(`ALTER TABLE ${this.tableName}
      ALTER COLUMN geometry TYPE geometry(Polygon, 4326)
      USING ST_SetSRID(ST_Force2D(ST_GeomFromGeoJSON(geometry)), 4326)
    `)

    this.schema.raw(`ALTER TABLE ${this.tableName}
      ADD CONSTRAINT operational_areas_geometry_valid CHECK (ST_IsValid(geometry))
    `)

    this.schema.raw(`CREATE INDEX operational_areas_geometry_index
      ON ${this.tableName}
      USING GIST (geometry)
    `)
  }

  async down() {
    this.schema.raw('DROP INDEX IF EXISTS operational_areas_geometry_index')

    this.schema.raw(`ALTER TABLE ${this.tableName}
      DROP CONSTRAINT IF EXISTS operational_areas_geometry_valid
    `)

    this.schema.raw(`ALTER TABLE ${this.tableName}
      ALTER COLUMN geometry TYPE jsonb
      USING ST_AsGeoJSON(geometry)::jsonb
    `)
  }
}
