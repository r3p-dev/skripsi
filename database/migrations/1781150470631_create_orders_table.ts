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

      table
        .integer('claimed_by')
        .nullable()
        .index()
        .references('id')
        .inTable('users')
        .onDelete('SET NULL')

      table.string('order_number').notNullable().unique()
      table.string('customer_name').notNullable()
      table.string('customer_phone').notNullable()
      table.string('status').notNullable().index()
      table.date('pickup_date').nullable().index()
      table.decimal('total_price', 10, 2).nullable()
      table.string('type').notNullable().index()
      table.string('claimed_task').nullable()
      table.timestamp('claimed_at').nullable()

      table.timestamp('created_at').notNullable()
      table.timestamp('updated_at').nullable()

      table.index(['user_id', 'created_at'])
      table.index(['status', 'pickup_date'])
      table.index(['status', 'created_at'])
      table.index(['claimed_by', 'claimed_at'])
    })

    this.schema.raw(`CREATE INDEX orders_order_number_trgm_index
      ON ${this.tableName} USING GIN (order_number gin_trgm_ops)
    `)
    this.schema.raw(`CREATE INDEX orders_customer_name_trgm_index
      ON ${this.tableName} USING GIN (customer_name gin_trgm_ops)
    `)
    this.schema.raw(`CREATE INDEX orders_customer_phone_trgm_index
      ON ${this.tableName} USING GIN (customer_phone gin_trgm_ops)
    `)
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
