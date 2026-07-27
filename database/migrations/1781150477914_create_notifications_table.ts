import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'notifications'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      table
        .integer('user_id')
        .notNullable()
        .index()
        .references('id')
        .inTable('users')
        .onDelete('CASCADE')

      table.string('title').notNullable()
      table.text('message').notNullable()

      table.timestamp('created_at').notNullable().index()
      table.timestamp('updated_at').nullable()

      table.index(['user_id', 'created_at'])
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
