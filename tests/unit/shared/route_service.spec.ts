import { test } from '@japa/runner'
import RouteService, { type RouteOrder } from '#services/route_service'
import type OsrmService from '#services/osrm_service'
import type { TravelMatrix } from '#services/osrm_service'
import { OrderStatus } from '#enums/order_status_enum'

/**
 * A road router that answers with a matrix written by hand.
 *
 * Standing in for OSRM lets these tests state a road layout outright —
 * including layouts no straight-line measurement could ever produce — without
 * needing a router process, an OSM extract, or a network.
 */
function makeRouterReturning(matrix: TravelMatrix | null): OsrmService {
  return {
    isEnabled: matrix !== null,
    async fetchTravelMatrix() {
      return matrix
    },
  } as unknown as OsrmService
}

/**
 * Builds a matrix where distance and time are the same grid, scaled.
 *
 * The planner minimises time, so the durations are what drive the result;
 * the distances ride along so the cards have something to show.
 */
function makeMatrix(durations: number[][]): TravelMatrix {
  return {
    durations,
    distances: durations.map((row) => row.map((seconds) => seconds * 10)),
  }
}

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

  test('a nearer stop is planned before a further one', async ({ assert }) => {
    const far = makeRouteOrder('ORD-FAR-1', makeAddress(-6.9, 107.75))
    const near = makeRouteOrder('ORD-NEAR-2', makeAddress(-6.95, 107.66))

    const plan = await service.buildRoutePlanForOrders([far, near], origin)

    assert.deepEqual(
      plan.map((item) => item.orderNumber),
      ['ORD-NEAR-2', 'ORD-FAR-1']
    )
    assert.isBelow(plan[0].distanceKm, plan[1].distanceKm)
  })

  test('each stop carries the distance shown on its card', async ({ assert }) => {
    const order = makeRouteOrder('ORD-NEAR-1', makeAddress(SHOP_LATITUDE + 0.09, SHOP_LONGITUDE))

    const [stop] = await service.buildRoutePlanForOrders([order], origin)

    assert.equal(stop.distanceKm, 10.01)
  })

  test('pickups and deliveries are ordered together as one route', async ({ assert }) => {
    const nearDelivery = makeRouteOrder(
      'ORD-DELIVERY-1',
      makeAddress(-6.95, 107.66),
      OrderStatus.IN_DELIVERY
    )
    const farPickup = makeRouteOrder('ORD-PICKUP-2', makeAddress(-6.9, 107.75))

    const plan = await service.buildRoutePlanForOrders([farPickup, nearDelivery], origin)

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
  test('a stop with no address sorts last rather than vanishing from the route', async ({
    assert,
  }) => {
    const withoutAddress = makeRouteOrder('ORD-NOWHERE-1', null)
    const withAddress = makeRouteOrder('ORD-SOMEWHERE-2', makeAddress(-6.9, 107.75))

    const plan = await service.buildRoutePlanForOrders([withoutAddress, withAddress], origin)

    assert.deepEqual(
      plan.map((item) => item.orderNumber),
      ['ORD-SOMEWHERE-2', 'ORD-NOWHERE-1']
    )
    assert.equal(plan[1].distanceKm, Number.POSITIVE_INFINITY)
  })
})

test.group('RouteService.buildRoutePlanForOrders with a road router', () => {
  const origin = { originLat: SHOP_LATITUDE, originLng: SHOP_LONGITUDE }

  const orderA = makeRouteOrder('ORD-A-1', makeAddress(-6.95, 107.66))
  const orderB = makeRouteOrder('ORD-B-2', makeAddress(-6.94, 107.67))

  /**
   * The case straight-line distance cannot represent at all.
   *
   * A is marginally nearer the shop, so a greedy chain drives there first and
   * is then stuck: the road from A to B runs the wrong way and costs a long
   * loop. Going to B first and taking the legal short hop back to A is barely
   * over a third of the total. Note that the two directions between A and B
   * disagree by a factor of seven — no measurement over coordinates alone can
   * produce that, which is the whole argument for asking a router.
   */
  test('a route follows the cheap direction down a one-way street', async ({ assert }) => {
    const service = new RouteService(
      makeRouterReturning(
        makeMatrix([
          [0, 300, 320],
          [300, 0, 900],
          [320, 120, 0],
        ])
      )
    )

    const plan = await service.buildRoutePlanForOrders([orderA, orderB], origin)

    assert.deepEqual(
      plan.map((item) => item.orderNumber),
      ['ORD-B-2', 'ORD-A-1']
    )
  })

  test('each stop reports the leg it was reached by', async ({ assert }) => {
    const service = new RouteService(
      makeRouterReturning(
        makeMatrix([
          [0, 300, 320],
          [300, 0, 900],
          [320, 120, 0],
        ])
      )
    )

    const [first, second] = await service.buildRoutePlanForOrders([orderA, orderB], origin)

    // The first stop is reached from the shop, so its leg is its distance.
    assert.equal(first.distanceKm, 3.2)
    assert.equal(first.legDistanceKm, 3.2)

    // The second is three kilometres from the shop but only 1.2 from where
    // the driver actually is, which is the number that plans the day.
    assert.equal(second.distanceKm, 3)
    assert.equal(second.legDistanceKm, 1.2)
    assert.equal(second.legDurationMin, 2)
  })

  /**
   * Distance and time disagree constantly in Bandung: an arterial at rush
   * hour loses to a longer run through side streets. The plan is built on the
   * durations grid for exactly this reason.
   */
  test('the plan minimises driving time rather than driving distance', async ({ assert }) => {
    const service = new RouteService(
      makeRouterReturning({
        durations: [
          [0, 600, 300],
          [600, 0, 400],
          [300, 400, 0],
        ],
        distances: [
          [0, 1000, 8000],
          [1000, 0, 4000],
          [8000, 4000, 0],
        ],
      })
    )

    const plan = await service.buildRoutePlanForOrders([orderA, orderB], origin)

    // B is eight times further away and still goes first, because it is half
    // the drive.
    assert.deepEqual(
      plan.map((item) => item.orderNumber),
      ['ORD-B-2', 'ORD-A-1']
    )
    assert.equal(plan[0].distanceKm, 8)
  })

  test('a stop the router cannot reach keeps its place on the board', async ({ assert }) => {
    const unreachable = Number.POSITIVE_INFINITY
    const service = new RouteService(
      makeRouterReturning(
        makeMatrix([
          [0, 300, unreachable],
          [300, 0, unreachable],
          [unreachable, unreachable, 0],
        ])
      )
    )

    const plan = await service.buildRoutePlanForOrders([orderA, orderB], origin)

    assert.deepEqual(
      plan.map((item) => item.orderNumber),
      ['ORD-A-1', 'ORD-B-2']
    )
    assert.equal(plan[1].distanceKm, Number.POSITIVE_INFINITY)
  })

  /**
   * The failure this planner was rebuilt around, kept as a fixture.
   *
   * These are real OSRM driving times between the shop and five stops in
   * north-west Bandung — Sarijadi, Setiabudi, Cihampelas Walk, ITB and Gasibu,
   * in that order. Started from a nearest-neighbour chain alone, Or-opt used
   * to settle on Gasibu → Sarijadi → Setiabudi → Ciwalk → ITB and stop there,
   * a genuine local optimum with no improving relocation available. The
   * cheaper route is that one driven backwards, which Or-opt will not consider
   * by design, so the plan came out 10.6% worse than simply sorting the stops
   * by distance from the shop.
   *
   * Seeding the search with that sorted order is what closes the hole, and
   * this test is here to notice if the seeding is ever removed.
   */
  const NORTH_WEST_BANDUNG_DURATIONS = [
    [0, 1119.6, 864.5, 852.2, 893.4, 633.6],
    [1131.7, 0, 336.2, 461.4, 753.1, 594.3],
    [901.1, 343.9, 0, 199.9, 514.6, 375.6],
    [701.2, 510.4, 206.1, 0, 334.5, 175.7],
    [815.6, 699.1, 458.1, 351.5, 0, 248.4],
    [682.6, 535.2, 294.2, 281.9, 309, 0],
  ]

  const northWestBandungStops = [
    makeRouteOrder('ORD-SARIJADI-1', makeAddress(-6.8763, 107.5745)),
    makeRouteOrder('ORD-SETIABUDI-2', makeAddress(-6.8827, 107.5936)),
    makeRouteOrder('ORD-CIWALK-3', makeAddress(-6.8938, 107.6045)),
    makeRouteOrder('ORD-ITB-4', makeAddress(-6.8915, 107.6107)),
    makeRouteOrder('ORD-GASIBU-5', makeAddress(-6.9006, 107.618)),
  ]

  /**
   * Adds up what a plan really costs to drive, straight from the matrix the
   * router handed over, so the assertion is about minutes rather than about
   * which permutation happened to come out.
   */
  function totalDurationOf(orderNumbers: string[], durations: number[][]): number {
    const indexOf = (orderNumber: string) =>
      northWestBandungStops.findIndex((order) => order.orderNumber === orderNumber) + 1

    let total = 0
    let previous = 0

    for (const orderNumber of orderNumbers) {
      total += durations[previous][indexOf(orderNumber)]
      previous = indexOf(orderNumber)
    }

    return total
  }

  test('a route never costs more than sorting the stops by distance from the shop', async ({
    assert,
  }) => {
    const service = new RouteService(makeRouterReturning(makeMatrix(NORTH_WEST_BANDUNG_DURATIONS)))

    const plan = await service.buildRoutePlanForOrders(northWestBandungStops, origin)

    const sorted = [...northWestBandungStops]
      .map((order, index) => ({ order, cost: NORTH_WEST_BANDUNG_DURATIONS[0][index + 1] }))
      .sort((left, right) => left.cost - right.cost)
      .map((entry) => entry.order.orderNumber)

    const planned = plan.map((item) => item.orderNumber)

    assert.isAtMost(
      totalDurationOf(planned, NORTH_WEST_BANDUNG_DURATIONS),
      totalDurationOf(sorted, NORTH_WEST_BANDUNG_DURATIONS)
    )
  })

  test('a route reaches the cheapest order on these stops', async ({ assert }) => {
    const service = new RouteService(makeRouterReturning(makeMatrix(NORTH_WEST_BANDUNG_DURATIONS)))

    const plan = await service.buildRoutePlanForOrders(northWestBandungStops, origin)

    // Gasibu is nearest the shop, and from there the run works outward along
    // Dago and Cihampelas to Sarijadi at the far end. 1844.1 seconds is the
    // exact optimum for this matrix, found by solving it exhaustively.
    assert.deepEqual(
      plan.map((item) => item.orderNumber),
      ['ORD-GASIBU-5', 'ORD-ITB-4', 'ORD-CIWALK-3', 'ORD-SETIABUDI-2', 'ORD-SARIJADI-1']
    )
    assert.closeTo(
      totalDurationOf(
        plan.map((item) => item.orderNumber),
        NORTH_WEST_BANDUNG_DURATIONS
      ),
      1844.1,
      0.1
    )
  })

  /**
   * A courier who has to come home pays for the leg home, and a plan that
   * ignores it is free to finish on the far side of the city.
   *
   * These stops make the point sharply: the best open run and the best round
   * trip are different orders, not the same order relabelled. Left open, the
   * driver ends at Sarijadi and the way back is somebody else's problem; made
   * to return, the cheapest plan runs the other way round the loop.
   */
  test('a round trip is planned to curve back towards the shop', async ({ assert }) => {
    const service = new RouteService(makeRouterReturning(makeMatrix(NORTH_WEST_BANDUNG_DURATIONS)))

    const roundTrip = await service.buildRoutePlanForOrders(northWestBandungStops, {
      ...origin,
      returnToOrigin: true,
    })

    // 2855.0 seconds including the leg home, again the exhaustive optimum.
    assert.deepEqual(
      roundTrip.map((item) => item.orderNumber),
      ['ORD-GASIBU-5', 'ORD-SARIJADI-1', 'ORD-SETIABUDI-2', 'ORD-CIWALK-3', 'ORD-ITB-4']
    )
  })

  /**
   * A router that is down, wedged, or simply switched off must not take the
   * trip board down with it. The plan degrades to straight-line ordering,
   * which is worse routing and still a usable day's work.
   */
  test('planning survives the router being unavailable', async ({ assert }) => {
    const service = new RouteService(makeRouterReturning(null))

    const plan = await service.buildRoutePlanForOrders([orderA, orderB], origin)

    assert.lengthOf(plan, 2)
    assert.isTrue(plan.every((item) => Number.isFinite(item.distanceKm)))
  })
})
