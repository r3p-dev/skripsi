import Tables from '#enums/table_enum'
import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = Tables.ORDER_ITEMS

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
      table
        .integer('service_id')
        .unsigned()
        .notNullable()
        .references('id')
        .inTable(Tables.SERVICES)
        .onDelete('RESTRICT')
      table
        .integer('shoe_id')
        .unsigned()
        .notNullable()
        .references('id')
        .inTable(Tables.SHOES)
        .onDelete('CASCADE')

      table.string('name').notNullable()
      table.decimal('price', 10, 2).notNullable()
      table.decimal('subtotal', 10, 2).notNullable()

      table.timestamp('created_at').notNullable()
      table.timestamp('updated_at').nullable()
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
