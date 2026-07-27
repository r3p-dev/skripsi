import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'orders'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      table
        .integer('user_id')
        .nullable()
        .index()
        .references('id')
        .inTable('users')
        .onDelete('RESTRICT')
      table
        .integer('address_id')
        .nullable()
        .index()
        .references('id')
        .inTable('addresses')
        .onDelete('RESTRICT')

      table.string('customer_name').notNullable()
      table.string('customer_phone').notNullable()
      table.string('order_number').notNullable().unique()
      table.string('status').notNullable().index()
      table.date('pickup_date').nullable().index()
      table.decimal('total_price', 10, 2).nullable()

      table.timestamp('created_at').notNullable()
      table.timestamp('updated_at').nullable()

      table.index(['user_id', 'created_at'])
      table.index(['status', 'pickup_date'])
      table.index(['status', 'created_at'])
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
