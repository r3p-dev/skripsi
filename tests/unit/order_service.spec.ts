import { test } from '@japa/runner'
import { DateTime } from 'luxon'
import OrderService from '#services/order_service'
import RouteService from '#services/route_service'

test.group('order service routing and limits', () => {
  test('sorts orders by proximity for the selected day', ({ assert }) => {
    const service = new RouteService()
    const orders = [
      {
        id: 1,
        orderNumber: 'ORD-001',
        pickupDate: DateTime.fromISO('2026-07-10'),
        status: 'pickup_scheduled',
        address: { latitude: -6.9565, longitude: 107.655 },
      },
      {
        id: 2,
        orderNumber: 'ORD-002',
        pickupDate: DateTime.fromISO('2026-07-10'),
        status: 'pickup_scheduled',
        address: { latitude: -6.9555, longitude: 107.654 },
      },
      {
        id: 3,
        orderNumber: 'ORD-003',
        pickupDate: DateTime.fromISO('2026-07-10'),
        status: 'pickup_scheduled',
        address: { latitude: -6.9575, longitude: 107.656 },
      },
    ] as any

    const route = service.buildRoutePlanForOrders(orders, {
      originLat: -6.9555,
      originLng: 107.654,
      selectedDate: DateTime.fromISO('2026-07-10'),
    })

    assert.deepEqual(
      route.map((item) => item.orderNumber),
      ['ORD-002', 'ORD-001', 'ORD-003']
    )
  })

  test('supports delivery route planning for in_delivery orders', ({ assert }) => {
    const service = new RouteService()
    const orders = [
      {
        id: 1,
        orderNumber: 'DEL-001',
        pickupDate: DateTime.fromISO('2026-07-10'),
        status: 'in_delivery',
        address: { latitude: -6.9565, longitude: 107.655 },
      },
      {
        id: 2,
        orderNumber: 'DEL-002',
        pickupDate: DateTime.fromISO('2026-07-10'),
        status: 'in_delivery',
        address: { latitude: -6.9555, longitude: 107.654 },
      },
    ] as any

    const route = service.buildRoutePlanForOrders(orders, {
      originLat: -6.9555,
      originLng: 107.654,
      selectedDate: DateTime.fromISO('2026-07-10'),
    })

    assert.deepEqual(
      route.map((item) => item.orderNumber),
      ['DEL-002', 'DEL-001']
    )
  })

  test('prints a sample route payload for pickup and delivery orders', ({ assert }) => {
    const service = new RouteService()
    const orders = [
      {
        id: 1,
        orderNumber: 'ORD-001',
        pickupDate: DateTime.fromISO('2026-07-10'),
        status: 'pickup_scheduled',
        address: { latitude: -6.9555, longitude: 107.654 },
      },
      {
        id: 2,
        orderNumber: 'ORD-002',
        pickupDate: DateTime.fromISO('2026-07-10'),
        status: 'in_delivery',
        address: { latitude: -6.9, longitude: 107.7 },
      },
      {
        id: 3,
        orderNumber: 'ORD-003',
        pickupDate: DateTime.fromISO('2026-07-10'),
        status: 'pickup_scheduled',
        address: { latitude: -6.9565, longitude: 107.655 },
      },
    ] as any

    const route = service.buildRoutePlanForOrders(orders, {
      originLat: -6.9555,
      originLng: 107.654,
      selectedDate: DateTime.fromISO('2026-07-10'),
    })

    // console.log('Sample route payload:', JSON.stringify(route, null, 2))

    assert.deepEqual(
      route.map((item) => item.orderNumber),
      ['ORD-001', 'ORD-003', 'ORD-002']
    )
    assert.deepEqual(
      route.map((item) => item.label),
      ['Jemput', 'Jemput', 'Antar']
    )
  })

  test('blocks new orders once the daily limit is reached', ({ assert }) => {
    const service = new OrderService()
    const orders = Array.from({ length: 10 }, (_, index) => ({
      id: index + 1,
      status: 'pickup_scheduled',
      pickupDate: DateTime.fromISO('2026-07-10'),
    }))

    assert.isTrue(
      service.hasReachedDailyOrderLimit(orders as any, DateTime.fromISO('2026-07-10'), 10)
    )
  })
})
