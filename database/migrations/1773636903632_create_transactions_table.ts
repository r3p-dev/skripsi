import Tables from '#enums/table_enum'
import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = Tables.TRANSACTIONS

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

      table.integer('type').unsigned().notNullable().defaultTo(0)
      table.integer('payment_method').unsigned().notNullable().defaultTo(0)
      table.text('midtrans_order_id').nullable()
      table.string('midtrans_code').nullable()
      table.integer('status').unsigned().notNullable().defaultTo(0)
      table.decimal('amount', 10, 2).notNullable()

      table.timestamp('paid_at').nullable()
      table.timestamp('expired_at').notNullable()

      table.timestamp('created_at').notNullable()
      table.timestamp('updated_at').nullable()
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
