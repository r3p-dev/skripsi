import { test } from '@japa/runner'
import RouteService, { type RouteOrder } from '#services/route_service'
import { OrderStatus } from '#enums/order_status_enum'

/**
 * The shop, which is where every route starts. Same coordinates as
 * TripController uses in production.
 */
const SHOP_LATITUDE = -6.9555305
const SHOP_LONGITUDE = 107.6540353

function makeRouteOrder(
  orderNumber: string,
  address: RouteOrder['address'],
  status: OrderStatus = OrderStatus.PICKUP_SCHEDULED
): RouteOrder {
  return {
    id: Number(orderNumber.slice(-1)),
    orderNumber,
    status,
    pickupDate: null,
    address,
  }
}

function makeAddress(latitude: number, longitude: number): RouteOrder['address'] {
  return {
    name: 'Penerima',
    phone: '081387882973',
    street: 'Jalan Contoh 1',
    latitude,
    longitude,
  }
}

test.group('RouteService.calculateDistanceInKm', () => {
  const service = new RouteService()

  test('a stop at the shop itself is zero kilometres away', ({ assert }) => {
    const distance = service.calculateDistanceInKm(
      SHOP_LATITUDE,
      SHOP_LONGITUDE,
      SHOP_LATITUDE,
      SHOP_LONGITUDE
    )

    assert.equal(distance, 0)
  })

  test('one degree of latitude is roughly 111 kilometres', ({ assert }) => {
    // The classic geodesic anchor: 1° of latitude ≈ 111.19 km anywhere on earth.
    assert.equal(service.calculateDistanceInKm(0, 0, 1, 0), 111.19)
    assert.equal(
      service.calculateDistanceInKm(SHOP_LATITUDE, SHOP_LONGITUDE, -5.9555305, 107.6540353),
      111.19
    )
  })

  test('the distance is the same in either direction', ({ assert }) => {
    const there = service.calculateDistanceInKm(SHOP_LATITUDE, SHOP_LONGITUDE, -6.9, 107.7)
    const back = service.calculateDistanceInKm(-6.9, 107.7, SHOP_LATITUDE, SHOP_LONGITUDE)

    assert.equal(there, back)
  })

  test('the result is rounded to two decimals for display on a card', ({ assert }) => {
    const distance = service.calculateDistanceInKm(
      SHOP_LATITUDE,
      SHOP_LONGITUDE,
      SHOP_LATITUDE + 0.09,
      SHOP_LONGITUDE
    )

    assert.equal(distance, 10.01)
  })
})

test.group('RouteService.buildRoutePlanForOrders', () => {
  const service = new RouteService()
  const origin = { originLat: SHOP_LATITUDE, originLng: SHOP_LONGITUDE }

  test('a nearer stop is planned before a further one', ({ assert }) => {
    const far = makeRouteOrder('ORD-FAR-1', makeAddress(-6.9, 107.75))
    const near = makeRouteOrder('ORD-NEAR-2', makeAddress(-6.95, 107.66))

    const plan = service.buildRoutePlanForOrders([far, near], origin)

    assert.deepEqual(
      plan.map((item) => item.orderNumber),
      ['ORD-NEAR-2', 'ORD-FAR-1']
    )
    assert.isBelow(plan[0].distanceKm, plan[1].distanceKm)
  })

  test('each stop carries the distance shown on its card', ({ assert }) => {
    const order = makeRouteOrder('ORD-NEAR-1', makeAddress(SHOP_LATITUDE + 0.09, SHOP_LONGITUDE))

    const [stop] = service.buildRoutePlanForOrders([order], origin)

    assert.equal(stop.distanceKm, 10.01)
  })

  test('pickups and deliveries are ordered together as one route', ({ assert }) => {
    const nearDelivery = makeRouteOrder(
      'ORD-DELIVERY-1',
      makeAddress(-6.95, 107.66),
      OrderStatus.IN_DELIVERY
    )
    const farPickup = makeRouteOrder('ORD-PICKUP-2', makeAddress(-6.9, 107.75))

    const plan = service.buildRoutePlanForOrders([farPickup, nearDelivery], origin)

    assert.deepEqual(
      plan.map((item) => item.orderNumber),
      ['ORD-DELIVERY-1', 'ORD-PICKUP-2']
    )
  })

  /**
   * The trip queue cannot actually hand this one over: a stop with no address is
   * a walk-in, and walk-ins go straight from the counter to cleaning and then to
   * COMPLETED, so they are never PICKUP_SCHEDULED or IN_DELIVERY. The fallback is
   * here so a stop can never silently vanish from a driver's route if that ever
   * changes.
   */
  test('a stop with no address sorts last rather than vanishing from the route', ({ assert }) => {
    const withoutAddress = makeRouteOrder('ORD-NOWHERE-1', null)
    const withAddress = makeRouteOrder('ORD-SOMEWHERE-2', makeAddress(-6.9, 107.75))

    const plan = service.buildRoutePlanForOrders([withoutAddress, withAddress], origin)

    assert.deepEqual(
      plan.map((item) => item.orderNumber),
      ['ORD-SOMEWHERE-2', 'ORD-NOWHERE-1']
    )
    assert.equal(plan[1].distanceKm, Number.POSITIVE_INFINITY)
  })
})
