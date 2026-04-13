import Tables from '#enums/table_enum'
import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = Tables.DISCOUNTS

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')

      table.string('code').notNullable().unique()
      table.integer('type').unsigned().notNullable().defaultTo(0)
      table.decimal('amount', 10, 2).notNullable()
      table.decimal('min_total_price', 10, 2).notNullable()
      table.integer('max_discount').unsigned().notNullable()
      table.boolean('is_active').notNullable().defaultTo(true)

      table.timestamp('expired_at').notNullable()
      table.timestamp('created_at').notNullable()
      table.timestamp('updated_at').nullable()
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
