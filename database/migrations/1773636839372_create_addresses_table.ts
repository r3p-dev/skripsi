import Tables from '#enums/table_enum'
import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = Tables.ADDRESSES

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      table
        .integer('user_id')
        .unsigned()
        .notNullable()
        .references('id')
        .inTable(Tables.USERS)
        .onDelete('RESTRICT')

      table.string('name').notNullable()
      table.string('phone').notNullable()
      table.string('street').notNullable()
      table.decimal('latitude', 10, 6).notNullable()
      table.decimal('longitude', 10, 6).notNullable()
      table.decimal('radius', 7, 2).notNullable()
      table.text('note').nullable()
      table.boolean('is_active').notNullable().defaultTo(true)

      table.timestamp('created_at').notNullable()
      table.timestamp('updated_at').nullable()
    })

    this.schema.raw(`CREATE UNIQUE INDEX one_active_address_per_user
      ON ${this.tableName} (user_id)
      WHERE is_active = true
    `)
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
