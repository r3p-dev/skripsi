import { OrderStatus } from '#enums/order_status_enum'
import { Role } from '#enums/role_enum'
import Address from '#models/address'
import Order from '#models/order'
import User from '#models/user'
import OrderService from '#services/order_service'
import { DateTime } from 'luxon'

/**
 * Shared test helpers to reduce repetition across functional tests.
 *
 * - Entity factory helpers: create users, addresses, orders with sensible defaults.
 * - Client request helpers: wrap common request patterns (Inertia + CSRF + referer).
 *
 * These helpers keep the specs clean and make it easier to debug where failures occur.
 */

/**
 * Create a user with sensible defaults. Override any field via `overrides`.
 */
export async function createUser(): Promise<User> {
  return User.create({
    name: 'Valid Name',
    phone: '081387882973',
    password: 'password123',
    role: Role.CUSTOMER,
  })
}

export async function createAddress(userId: number) {
  return Address.create({
    userId: userId,
    recipientName: 'Valid Name',
    recipientPhone: '081387882973',
    addressDetail: 'Jalan Braga',
    latitude: -6.9555306,
    longitude: 107.6540354,
    note: 'Tolong diantar ke depan rumah',
    isActive: true,
  })
}

export async function createOrder(user: User, addressId: number) {
  const service = new OrderService()
  const number = await service.generateOrderNumber()

  return Order.create({
    userId: user.id,
    addressId: addressId,
    customerName: user.name,
    customerPhone: user.phone,
    pickupDate: DateTime.local().plus({ days: 1 }),
    orderNumber: number,
    status: OrderStatus.PICKUP_SCHEDULED,
    totalPrice: null,
  })
}
