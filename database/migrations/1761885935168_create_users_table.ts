import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'users'

  async up() {
    this.schema.raw('CREATE EXTENSION IF NOT EXISTS pg_trgm')

    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')

      table.string('role').notNullable().index()
      table.string('name').notNullable()
      table.string('phone').notNullable().unique()
      table.string('password').notNullable()
      table.boolean('is_active').notNullable().defaultTo(true).index()

      table.timestamp('password_changed_at').nullable()
      table.timestamp('created_at').notNullable()
      table.timestamp('updated_at').nullable()
    })

    /**
     * The staff customer picker matches with a leading wildcard
     * (`ILIKE '%term%'`), which no btree index can serve. Trigram GIN indexes
     * are the one index type that can answer those lookups.
     */
    this.schema.raw(`CREATE INDEX users_name_trgm_index
      ON ${this.tableName} USING GIN (name gin_trgm_ops)
    `)
    this.schema.raw(`CREATE INDEX users_phone_trgm_index
      ON ${this.tableName} USING GIN (phone gin_trgm_ops)
    `)
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
