import Tables from '#enums/table_enum'
import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = Tables.ORDERS

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      table
        .integer('user_id')
        .unsigned()
        .notNullable()
        .references('id')
        .inTable(Tables.USERS)
        .onDelete('RESTRICT')
      table
        .integer('address_id')
        .unsigned()
        .nullable()
        .references('id')
        .inTable(Tables.ADDRESSES)
        .onDelete('RESTRICT')
      table
        .integer('discount_id')
        .unsigned()
        .nullable()
        .references('id')
        .inTable(Tables.DISCOUNTS)
        .onDelete('SET NULL')
      table
        .integer('claimed_by')
        .unsigned()
        .nullable()
        .references('id')
        .inTable(Tables.USERS)
        .onDelete('SET NULL')

      table.string('number').notNullable().unique()
      table.date('date').notNullable()
      table.integer('type').unsigned().notNullable().defaultTo(0)
      table.integer('status').unsigned().notNullable().defaultTo(0)
      table.integer('payment_status').unsigned().notNullable().defaultTo(0)

      table.decimal('subtotal_price', 10, 2).notNullable()
      table.decimal('discount_amount', 10, 2).notNullable().defaultTo(0)
      table.decimal('total_price', 10, 2).notNullable()

      table.text('pickup_photo_path').nullable()
      table.text('inspection_photo_path').nullable()
      table.text('delivery_photo_path').nullable()

      table.timestamp('pickup_at').nullable()
      table.timestamp('inspection_at').nullable()
      table.timestamp('delivery_at').nullable()

      table.timestamp('created_at').notNullable()
      table.timestamp('updated_at').nullable()
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
