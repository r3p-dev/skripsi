import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'operational_areas'

  async up() {
    this.schema.raw('CREATE EXTENSION IF NOT EXISTS postgis')

    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')

      table.string('name').notNullable().unique()
      table.specificType('geometry', 'geometry(Polygon, 4326)').notNullable()
      table.boolean('is_active').notNullable().defaultTo(true)

      table.timestamp('created_at').notNullable()
      table.timestamp('updated_at').nullable()
    })

    this.schema.raw(`ALTER TABLE ${this.tableName}
      ADD CONSTRAINT operational_areas_geometry_valid CHECK (ST_IsValid(geometry))
    `)

    /**
     * Area lookups are point-in-polygon tests (`ST_Covers`), which only the
     * spatial index can serve.
     */
    this.schema.raw(`CREATE INDEX operational_areas_geometry_index
      ON ${this.tableName}
      USING GIST (geometry)
    `)
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
