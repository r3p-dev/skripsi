import factory from '@adonisjs/lucid/factories'
import Order from '#models/order'
import { DateTime } from 'luxon'
import { OrderStatus } from '#enums/order_status_enum'
import { OrderType } from '#enums/order_type_enum'
import { personName } from '#database/factories/support'

/**
 * Order numbers are unique in the database, and a random suffix collides often
 * enough to make any test that creates a batch of orders flaky. A counter keeps
 * them unique for the lifetime of the process.
 */
let orderSequence = 0

export const OrderFactory = factory
  .define(Order, async ({ faker }) => {
    orderSequence += 1

    return {
      customerName: personName(faker),
      customerPhone: `08${faker.string.numeric(10)}`,
      orderNumber: `ORD${DateTime.now().toFormat('yyLLdd')}-${String(orderSequence).padStart(3, '0')}`,
      pickupDate: DateTime.fromJSDate(faker.date.soon({ days: 30 })),
      status: OrderStatus.PICKUP_SCHEDULED,
      type: OrderType.ONLINE,
    }
  })
  .state('offline', (order) => {
    order.type = OrderType.OFFLINE
  })
  .state('inPickup', (order) => {
    order.status = OrderStatus.IN_PICKUP
  })
  .state('inInspection', (order) => {
    order.status = OrderStatus.IN_INSPECTION
  })
  .state('waitingPayment', (order, { faker }) => {
    order.status = OrderStatus.AWAITING_PAYMENT
    order.totalPrice = faker.number.int({
      min: 25000,
      max: 1000000,
    })
  })
  .state('inCleaning', (order, { faker }) => {
    order.status = OrderStatus.IN_CLEANING
    order.totalPrice = faker.number.int({
      min: 25000,
      max: 1000000,
    })
  })
  .state('inDelivery', (order, { faker }) => {
    order.status = OrderStatus.IN_DELIVERY
    order.totalPrice = faker.number.int({
      min: 25000,
      max: 1000000,
    })
  })
  .state('completed', (order, { faker }) => {
    order.status = OrderStatus.COMPLETED
    order.totalPrice = faker.number.int({
      min: 25000,
      max: 1000000,
    })
  })
  .state('cancelled', (order) => {
    order.status = OrderStatus.CANCELLED
  })
  .build()
