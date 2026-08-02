import { BaseSchema } from '@adonisjs/lucid/schema'

/**
 * When this account's password last changed.
 *
 * Sessions are held in a signed cookie, so there is no server-side table of
 * live sessions to go and delete rows from. What there is instead is a moment
 * to compare against: every session records when it was authenticated, and one
 * that predates the current password is a session belonging to whoever knew
 * the old one. That is exactly the session a password reset exists to end.
 */
export default class extends BaseSchema {
  protected tableName = 'users'

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.timestamp('password_changed_at').nullable()
    })
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('password_changed_at')
    })
  }
}
