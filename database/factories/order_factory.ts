import Order from '#models/order'
import factory from '@adonisjs/lucid/factories'
import { AddressFactory } from '#database/factories/address_factory'
import { ItemFactory } from '#database/factories/item_factory'
import { UserFactory } from '#database/factories/user_factory'
import { OrderStatus, OrderType } from '#enums/order_enum'
import { nextOrderNumber, personName, uniquePhone } from '#database/factories/support'
import { DateTime } from 'luxon'

export const OrderFactory = factory
  .define(Order, ({ faker }) => ({
    orderNumber: nextOrderNumber(),
    customerName: personName(faker),
    customerPhone: uniquePhone(),
    status: OrderStatus.PICKUP_SCHEDULED,
    type: OrderType.ONLINE,
    pickupDate: DateTime.now().plus({ days: 1 }),
    totalPrice: null,
  }))
  .state('walkIn', (order) => {
    order.merge({ type: OrderType.OFFLINE, addressId: null, pickupDate: null })
  })
  .state('walkInDelivery', (order) => {
    order.merge({ type: OrderType.WALK_IN_DELIVERY, pickupDate: null })
  })
  .state('pickupToday', (order) => {
    order.pickupDate = DateTime.now()
  })
  .state('collected', (order) => {
    order.status = OrderStatus.IN_PICKUP
  })
  .state('inCleaning', (order) => {
    order.status = OrderStatus.IN_CLEANING
  })
  .state('completed', (order) => {
    order.merge({ status: OrderStatus.COMPLETED, totalPrice: '120000' })
  })
  .state('cancelled', (order) => {
    order.status = OrderStatus.CANCELLED
  })
  .relation('user', () => UserFactory)
  .relation('address', () => AddressFactory)
  .relation('items', () => ItemFactory)
  .build()
