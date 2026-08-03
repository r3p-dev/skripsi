import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'orders'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      table
        .integer('user_id')
        .nullable()
        .index()
        .references('id')
        .inTable('users')
        .onDelete('RESTRICT')
      table
        .integer('address_id')
        .nullable()
        .index()
        .references('id')
        .inTable('addresses')
        .onDelete('RESTRICT')

      /**
       * Who is currently holding this order's task.
       *
       * The lock used to be derived by replaying an order's whole action log
       * in memory, which meant every queue query had to `preload('actions')`
       * and filter the results in JavaScript. These three columns are that
       * same answer as state, so the queues filter on an index instead. The
       * claim is still written to the action log as well: that log is the
       * audit trail of who did what, and must not become a column the next
       * claim overwrites.
       */
      table
        .integer('locked_by_id')
        .nullable()
        .references('id')
        .inTable('users')
        .onDelete('RESTRICT')

      table.string('locked_task').nullable()

      /**
       * When the claim lapses on its own.
       *
       * A staff member who claims a stop and then loses signal, goes home, or
       * simply forgets would otherwise keep that order out of everyone else's
       * queue forever, and the only way back would be an admin editing rows.
       */
      table.timestamp('locked_until').nullable()

      table.string('customer_name').notNullable()
      table.string('customer_phone').notNullable()
      table.string('order_number').notNullable().unique()
      table.string('status').notNullable().index()
      table.date('pickup_date').nullable().index()
      table.decimal('total_price', 10, 2).nullable()
      table.string('type').notNullable().index()

      table.timestamp('created_at').notNullable()
      table.timestamp('updated_at').nullable()

      table.index(['locked_task', 'locked_until'])
      table.index(['user_id', 'created_at'])
      table.index(['status', 'pickup_date'])
      table.index(['status', 'created_at'])
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
