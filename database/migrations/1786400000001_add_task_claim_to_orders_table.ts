import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'orders'

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table
        .integer('claimed_by')
        .nullable()
        .index()
        .references('id')
        .inTable('users')
        .onDelete('SET NULL')

      table.string('claimed_task').nullable()
      table.timestamp('claimed_at').nullable()

      table.index(['claimed_by', 'claimed_at'])
    })
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropIndex(['claimed_by', 'claimed_at'])
      table.dropColumn('claimed_at')
      table.dropColumn('claimed_task')
      table.dropColumn('claimed_by')
    })
  }
}
