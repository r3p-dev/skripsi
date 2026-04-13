import Tables from '#enums/table_enum'
import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = Tables.SHOES

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      table
        .integer('order_id')
        .unsigned()
        .notNullable()
        .references('id')
        .inTable(Tables.ORDERS)
        .onDelete('CASCADE')

      table.string('brand').notNullable()
      table.integer('size').notNullable()
      table.string('type').notNullable()
      table.string('material').notNullable()
      table.string('category').notNullable()
      table.string('condition').notNullable()
      table.text('note').nullable()

      table.timestamp('created_at').notNullable()
      table.timestamp('updated_at').nullable()
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
