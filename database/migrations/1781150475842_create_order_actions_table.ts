import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'order_actions'

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
        .integer('staff_id')
        .notNullable()
        .index()
        .references('id')
        .inTable('users')
        .onDelete('CASCADE')

      table.string('name').notNullable()
      table.text('photo_path').nullable()
      table.text('note').nullable()

      table.timestamp('created_at').notNullable()
      table.timestamp('updated_at').nullable()

      table.index(['order_id', 'created_at'])
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
