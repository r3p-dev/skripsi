import { test } from '@japa/runner'
import RoutingService, { type RoutePoint } from '#services/routing_service'

const routingService = new RoutingService()

const BANDUNG: RoutePoint = { latitude: -6.9175, longitude: 107.6191 }

function eastOf(origin: RoutePoint, kilometres: number): RoutePoint {
  return { latitude: origin.latitude, longitude: origin.longitude + kilometres * 0.009 }
}

test.group('RoutingService | nearest neighbour', () => {
  test('an empty queue plans nothing', async ({ assert }) => {
    const plan = await routingService.plan(BANDUNG, [])

    assert.isEmpty(plan.stops)
    assert.equal(plan.totalDistance, 0)
    assert.equal(plan.totalDuration, 0)
  })

  test('stops are visited closest first, not in the order they arrived', async ({ assert }) => {
    const stops = [
      { name: 'far', ...eastOf(BANDUNG, 9) },
      { name: 'near', ...eastOf(BANDUNG, 1) },
      { name: 'middle', ...eastOf(BANDUNG, 5) },
    ]

    const plan = await routingService.plan(BANDUNG, stops)

    assert.deepEqual(
      plan.stops.map((entry) => entry.stop.name),
      ['near', 'middle', 'far']
    )
  })

  test('every stop is planned exactly once', async ({ assert }) => {
    const stops = [
      { name: 'a', ...eastOf(BANDUNG, 3) },
      { name: 'b', ...eastOf(BANDUNG, 1) },
      { name: 'c', ...eastOf(BANDUNG, 7) },
      { name: 'd', ...eastOf(BANDUNG, 2) },
    ]

    const plan = await routingService.plan(BANDUNG, stops)

    assert.lengthOf(plan.stops, stops.length)
    assert.sameMembers(
      plan.stops.map((entry) => entry.stop.name),
      ['a', 'b', 'c', 'd']
    )
  })

  test('each leg is measured from the previous stop rather than from the depot', async ({
    assert,
  }) => {
    const near = { name: 'near', ...eastOf(BANDUNG, 1) }
    const far = { name: 'far', ...eastOf(BANDUNG, 9) }

    const plan = await routingService.plan(BANDUNG, [near, far])
    const [first, second] = plan.stops

    assert.isBelow(second.distance, routingService.haversine(BANDUNG, far) * 1.3)
    assert.closeTo(second.distance, routingService.haversine(near, far) * 1.3, 50)
    assert.isAbove(second.distance, first.distance)
  })

  test('the run total is the sum of its legs', async ({ assert }) => {
    const stops = [
      { name: 'a', ...eastOf(BANDUNG, 2) },
      { name: 'b', ...eastOf(BANDUNG, 6) },
      { name: 'c', ...eastOf(BANDUNG, 4) },
    ]

    const plan = await routingService.plan(BANDUNG, stops)
    const summed = plan.stops.reduce((total, entry) => total + entry.distance, 0)

    assert.closeTo(plan.totalDistance, summed, 3)
  })

  test('a single stop is simply the trip out to it', async ({ assert }) => {
    const plan = await routingService.plan(BANDUNG, [{ name: 'only', ...eastOf(BANDUNG, 4) }])

    assert.lengthOf(plan.stops, 1)
    assert.equal(plan.stops[0].distance, plan.totalDistance)
  })
})

test.group('RoutingService | falling back without OSRM', () => {
  test('planning still works when OSRM is switched off', async ({ assert }) => {
    const plan = await routingService.plan(BANDUNG, [{ name: 'a', ...eastOf(BANDUNG, 2) }])

    assert.equal(plan.source, 'haversine')
    assert.isAbove(plan.stops[0].distance, 0)
    assert.isAbove(plan.stops[0].duration, 0)
  })

  test('a drawable line is always produced, even as a straight segment', async ({ assert }) => {
    const destination = eastOf(BANDUNG, 3)
    const line = await routingService.line(BANDUNG, destination)

    assert.equal(line.source, 'haversine')
    assert.deepEqual(line.geometry, [
      [BANDUNG.longitude, BANDUNG.latitude],
      [destination.longitude, destination.latitude],
    ])
    assert.isAbove(line.distance, 0)
  })

  test('the fallback pads straight-line distance rather than understating the drive', async ({
    assert,
  }) => {
    const destination = eastOf(BANDUNG, 10)
    const straight = routingService.haversine(BANDUNG, destination)
    const line = await routingService.line(BANDUNG, destination)

    assert.isAbove(line.distance, straight)
  })
})

test.group('RoutingService | haversine', () => {
  test('a point is no distance from itself', ({ assert }) => {
    assert.equal(routingService.haversine(BANDUNG, BANDUNG), 0)
  })

  test('distance is symmetric', ({ assert }) => {
    const other = eastOf(BANDUNG, 5)

    assert.closeTo(
      routingService.haversine(BANDUNG, other),
      routingService.haversine(other, BANDUNG),
      0.001
    )
  })

  test('a degree of longitude at this latitude is roughly 110 km', ({ assert }) => {
    const other = { latitude: BANDUNG.latitude, longitude: BANDUNG.longitude + 1 }

    assert.closeTo(routingService.haversine(BANDUNG, other), 110_600, 1_500)
  })
})
