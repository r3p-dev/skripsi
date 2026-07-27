import factory from '@adonisjs/lucid/factories'
import Order from '#models/order'
import { DateTime } from 'luxon'
import { OrderStatus } from '#enums/order_status_enum'

export const OrderFactory = factory
  .define(Order, async ({ faker }) => {
    return {
      customerName: faker.person.fullName(),
      customerPhone: `08${faker.string.numeric(10)}`,
      orderNumber: `ORD${DateTime.now().toFormat('yyLLdd')}-${faker.string.numeric(3)}`,
      pickupDate: DateTime.fromJSDate(faker.date.soon({ days: 30 })),
      status: OrderStatus.PICKUP_SCHEDULED,
    }
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
