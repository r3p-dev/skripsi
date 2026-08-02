import { BaseSchema } from '@adonisjs/lucid/schema'

/**
 * Who is currently holding an order's task, stored on the order itself.
 *
 * The lock used to be derived by replaying an order's whole action log in
 * memory, which meant every queue query had to `preload('actions')` and then
 * filter the results in JavaScript — the queue could not be asked for "the
 * free ones" in SQL at all. These three columns are that same answer as
 * state, so the queues filter on an index instead.
 *
 * The claim is still written to the action log as well: the log is the audit
 * trail of who did what, and that must not become a column that the next
 * claim overwrites.
 */
export default class extends BaseSchema {
  protected tableName = 'orders'

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
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

      table.index(['locked_task', 'locked_until'])
    })
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropIndex(['locked_task', 'locked_until'])
      table.dropColumn('locked_by_id')
      table.dropColumn('locked_task')
      table.dropColumn('locked_until')
    })
  }
}
