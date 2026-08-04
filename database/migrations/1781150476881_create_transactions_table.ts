import { TransactionStatus } from '#enums/transaction_enum'
import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'transactions'

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

      table.string('payment_method').notNullable()
      table.string('midtrans_order_id').nullable().index()
      table.string('midtrans_transaction_id').nullable().index()
      table.text('qr_code').nullable()
      table.string('status').notNullable().index()
      table.decimal('cash_received', 10, 2).nullable()

      table.timestamp('created_at').notNullable()
      table.timestamp('updated_at').nullable()

      table.index(['midtrans_order_id', 'status'])
      table.index(['status', 'created_at'])
    })

    this.schema.raw(`
      CREATE UNIQUE INDEX transactions_order_id_pending_unique
      ON ${this.tableName} (order_id)
      WHERE status = '${TransactionStatus.PENDING}'
    `)
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
