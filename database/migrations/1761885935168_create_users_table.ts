import Tables from '#enums/table_enum'
import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = Tables.USERS

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id').notNullable()

      table.integer('role').unsigned().notNullable().defaultTo(0)
      table.string('name').notNullable()
      table.string('phone', 13).notNullable().unique()
      table.string('password').notNullable()
      table.boolean('is_active').notNullable().defaultTo(true)
      table.boolean('is_registered').notNullable().defaultTo(true)

      table.timestamp('created_at').notNullable()
      table.timestamp('updated_at').nullable()
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
