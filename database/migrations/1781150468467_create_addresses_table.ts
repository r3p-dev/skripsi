import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'addresses'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      table
        .integer('user_id')
        .notNullable()
        .index()
        .references('id')
        .inTable('users')
        .onDelete('RESTRICT')

      table.string('recipient_name').notNullable()
      table.string('recipient_phone').notNullable()
      table.string('address_detail').notNullable()
      table.decimal('latitude', 10, 7).notNullable()
      table.decimal('longitude', 10, 7).notNullable()
      table.boolean('is_active').notNullable().defaultTo(true)
      table.text('note').nullable()

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
