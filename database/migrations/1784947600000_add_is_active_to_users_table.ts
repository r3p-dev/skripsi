import { BaseSchema } from '@adonisjs/lucid/schema'

/**
 * Staff leave, and when they do their account has to stop working without
 * taking the record of their work with it. Every pickup, inspection and
 * delivery they ever completed is attributed to them, and the orders those
 * actions belong to are the shop's history — so the account is switched off
 * rather than deleted.
 */
export default class extends BaseSchema {
  protected tableName = 'users'

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.boolean('is_active').notNullable().defaultTo(true).index()
    })
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('is_active')
    })
  }
}
