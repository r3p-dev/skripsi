import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'items'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')

      table.string('type').notNullable().index()
      table.string('brand').notNullable().index()
      table.string('model').notNullable().index()
      table.string('condition').notNullable()
      table.string('size').notNullable()
      table.string('material').nullable()
      table.text('note').nullable()

      table.timestamp('created_at').notNullable()
      table.timestamp('updated_at').nullable()

      table.index(['type', 'brand'])
    })
  }
  async down() {
    this.schema.dropTable(this.tableName)
  }
}
