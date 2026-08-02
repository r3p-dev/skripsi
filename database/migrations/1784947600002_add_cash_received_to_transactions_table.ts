import { BaseSchema } from '@adonisjs/lucid/schema'

/**
 * What the customer actually handed over at the counter, so the system can
 * work out the change instead of the staff member reaching for a calculator.
 *
 * Only cash has one: a debit or QRIS payment is always for the exact amount,
 * so there is nothing to give back and nothing to record.
 */
export default class extends BaseSchema {
  protected tableName = 'transactions'

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.decimal('cash_received', 10, 2).nullable()
    })
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('cash_received')
    })
  }
}
