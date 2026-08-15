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
        .integer('user_id')
        .nullable()
        .index()
        .references('id')
        .inTable('users')
        .onDelete('SET NULL')

      table.string('name').notNullable().index()
      table.string('photo_path').nullable()
      table.text('note').nullable()

      table.timestamp('created_at').notNullable()
      table.timestamp('updated_at').nullable()

      table.index(['order_id', 'name'])
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
