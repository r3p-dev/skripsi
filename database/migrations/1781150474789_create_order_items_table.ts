import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'order_items'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      table
        .integer('order_id')
        .notNullable()
        .index()
        .references('id')
        .inTable('orders')
        .onDelete('CASCADE')
      table
        .integer('service_id')
        .notNullable()
        .index()
        .references('id')
        .inTable('services')
        .onDelete('RESTRICT')
      table
        .integer('item_id')
        .notNullable()
        .index()
        .references('id')
        .inTable('items')
        .onDelete('CASCADE')

      table.string('name').notNullable()
      table.decimal('price', 10, 2).notNullable()
      table.decimal('subtotal', 10, 2).notNullable()

      table.timestamp('created_at').notNullable()
      table.timestamp('updated_at').nullable()

      table.index(['order_id', 'service_id'])
      table.index(['service_id', 'item_id'])
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
