import type { OrderStatus } from '#enums/order_status_enum'
import type { DateTime } from 'luxon'
import { inject } from '@adonisjs/core'
import OsrmService, { type RoutePoint, type TravelMatrix } from '#services/osrm_service'

/**
 * Coordinates used as the starting point for route calculation.
 */
type RoutePlanInput = {
  originLat: number
  originLng: number
  /**
   * Whether the driver has to end the run back at the origin.
   *
   * Off by default, which is what the trip board wants: a stop is claimed and
   * worked by whoever takes it, and where they go afterwards is the next
   * plan's problem. Turn it on for a round the same courier drives start to
   * finish, where the leg home is real distance somebody pays for and leaving
   * it out of the arithmetic quietly rewards plans that finish far from base.
   */
  returnToOrigin?: boolean
}

/**
 * Minimal order data required for route planning.
 */
export type RouteOrder = {
  id: number
  orderNumber: string
  status: OrderStatus
  pickupDate: DateTime | null
  address: {
    name: string
    phone: string
    street: string
    latitude: number
    longitude: number
    note?: string
  } | null
}

/**
 * Route item enriched with calculated distance.
 */
export type RouteItem = RouteOrder & {
  /** Road distance from the shop, in kilometres. */
  distanceKm: number
  /** Driving time from the shop, in minutes. */
  durationMin: number
  /** Road distance from the previous stop on the route, in kilometres. */
  legDistanceKm: number
  /** Driving time from the previous stop on the route, in minutes. */
  legDurationMin: number
}

/**
 * Average city speed used only when the road router is unavailable.
 *
 * Straight-line distances carry no notion of time, so the fallback invents
 * one to keep the planner working on a single unit. The figure is a rough
 * Bandung average including lights and congestion; it never affects the
 * ordering, because scaling every cost by the same constant cannot reorder
 * them. It exists so the minutes shown on a card are not nonsense.
 */
const FALLBACK_SPEED_KMH = 20

/**
 * Longest run of stops the improvement pass will relocate in one move.
 *
 * Three is the usual choice for Or-opt: long enough to move a small cluster
 * of neighbouring stops together, short enough that the search stays cheap.
 */
const MAX_RELOCATED_SEGMENT = 3

/**
 * How many times the improvement pass may sweep the whole route.
 *
 * Or-opt converges in a handful of sweeps on routes this size. The cap is
 * only there so a pathological matrix — one full of ties, say — cannot spin
 * the request thread.
 */
const MAX_IMPROVEMENT_PASSES = 20

/**
 * Cost improvement below which a move is not worth taking.
 *
 * Guards against floating-point noise flipping two equivalent routes back
 * and forth forever, each swap looking like a microscopic gain.
 */
const MEANINGFUL_IMPROVEMENT = 1e-6

@inject()
export default class RouteService {
  /**
   * The router defaults to a real instance so the service can still be built
   * by hand in tests. That costs nothing: with `OSRM_ENABLED` unset the
   * router short-circuits without touching the network, so a test that does
   * not care about roads silently gets the straight-line planner.
   */
  constructor(private osrmService: OsrmService = new OsrmService()) {}

  /**
   * Builds the order in which stops should actually be driven.
   *
   * This used to sort every stop by its distance from the shop, which reads
   * like a route but is not one: it answers "which stop is nearest the shop"
   * for each stop independently, so a plan could run shop → A → B with A and
   * B on opposite sides of the city, purely because both happened to be close
   * to the shop. The question a driver needs answered is the other one —
   * which stop is nearest *the one I am standing at*.
   *
   * So the stops are now chained. A nearest-neighbour pass builds an initial
   * chain from the shop outward, then an Or-opt pass tries to relocate runs
   * of stops to cheaper positions until it cannot improve the total any
   * further. Both work on whatever cost matrix is available: real driving
   * times from OSRM when the router is up, straight-line distances when it is
   * not. Only the quality of the answer changes, never the shape of it.
   *
   * Stops with no address cannot be routed and are appended at the end rather
   * than dropped, so a stop can never silently vanish from a driver's board.
   */
  async buildRoutePlanForOrders(orders: RouteOrder[], input: RoutePlanInput): Promise<RouteItem[]> {
    const routable = orders.filter((order) => order.address !== null)
    const unroutable = orders.filter((order) => order.address === null)

    const plan = routable.length > 0 ? await this.planRoutableStops(routable, input) : []

    return [...plan, ...unroutable.map((order) => this.toUnreachableItem(order))]
  }

  /**
   * Orders the stops that do have an address, cheapest total route first.
   */
  private async planRoutableStops(
    orders: RouteOrder[],
    input: RoutePlanInput
  ): Promise<RouteItem[]> {
    // Index 0 is the shop throughout: every matrix row and column below is
    // offset by one from the orders array because of it.
    const points: RoutePoint[] = [
      { latitude: input.originLat, longitude: input.originLng },
      ...orders.map((order) => ({
        latitude: order.address!.latitude,
        longitude: order.address!.longitude,
      })),
    ]

    const matrix =
      (await this.osrmService.fetchTravelMatrix(points)) ?? this.buildStraightLineMatrix(points)

    // Time, not distance, is what the plan minimises. Five kilometres of
    // clear side street beats three kilometres of Pasteur at five o'clock,
    // and only the durations grid knows the difference.
    const sequence = this.planBestOfSeeds(
      matrix.durations,
      orders.length,
      input.returnToOrigin ?? false
    )

    return sequence.map((pointIndex, position) => {
      const previousPointIndex = position === 0 ? 0 : sequence[position - 1]

      return {
        ...orders[pointIndex - 1],
        distanceKm: this.toKm(matrix.distances[0][pointIndex]),
        durationMin: this.toMinutes(matrix.durations[0][pointIndex]),
        legDistanceKm: this.toKm(matrix.distances[previousPointIndex][pointIndex]),
        legDurationMin: this.toMinutes(matrix.durations[previousPointIndex][pointIndex]),
      }
    })
  }

  /**
   * Improves several different starting routes and keeps whichever ends up
   * cheapest.
   *
   * Or-opt is a local search, and a local search only ever walks downhill from
   * wherever it was dropped. Started from a single nearest-neighbour chain it
   * can and does settle in a valley that is worse than the plain sort this
   * service replaced — measured on real Bandung stops, one set came out 10.6%
   * above a route that sorting by distance from the shop found for free. The
   * produced route was a genuine local optimum with no improving relocation
   * available; the cheaper route was that same route driven backwards, which
   * is precisely the reversal Or-opt refuses to consider and 2-opt cannot be
   * trusted to consider on a one-way network.
   *
   * Dropping the search into three valleys instead of one costs three times
   * almost nothing and buys a guarantee worth having: the sorted order is
   * itself one of the seeds, and a seed is only ever replaced by something
   * cheaper, so the plan can never come out worse than the sort it replaced.
   */
  private planBestOfSeeds(costs: number[][], stopCount: number, closeTour: boolean): number[] {
    const seeds = [
      // Greedy chaining: usually the best of the three, and the one whose
      // failure mode the other two exist to cover.
      this.planByNearestNeighbour(costs, stopCount),
      // The old sort-by-distance-from-origin. Weak as a plan and valuable as a
      // seed: it is the one ordering this service must never lose to.
      this.planByCostFromOrigin(costs, stopCount, 'nearest-first'),
      // Furthest first, which on a round trip is the shape of driving out to
      // the edge of the run and working back in towards the origin.
      this.planByCostFromOrigin(costs, stopCount, 'furthest-first'),
    ]

    let best = seeds[0]
    let bestCost = Number.POSITIVE_INFINITY

    for (const seed of seeds) {
      const improved = this.improveByRelocatingSegments(costs, seed, closeTour)
      const cost = this.totalCost(costs, improved, closeTour)

      if (cost < bestCost) {
        best = improved
        bestCost = cost
      }
    }

    return best
  }

  /**
   * Orders every stop by what it costs to reach straight from the origin.
   *
   * On its own this is the bug this service was written to fix — it answers
   * "how far is each stop from base" rather than "which stop is nearest the
   * one I am standing at". It survives only as a seed for the improvement
   * pass, where being a different starting point is the entire contribution.
   */
  private planByCostFromOrigin(
    costs: number[][],
    stopCount: number,
    direction: 'nearest-first' | 'furthest-first'
  ): number[] {
    const sign = direction === 'nearest-first' ? 1 : -1

    return Array.from({ length: stopCount }, (_unused, index) => index + 1).sort((left, right) => {
      const difference = sign * (costs[0][left] - costs[0][right])

      // Two unreachable stops subtract to NaN, which a comparator must never
      // return. Fall back to the order they arrived in so the sort stays total.
      return Number.isNaN(difference) ? left - right : difference
    })
  }

  /**
   * Chains the stops together, each time hopping to whichever unvisited stop
   * is cheapest to reach from the one just left.
   *
   * Nearest neighbour is greedy and known to be imperfect — it can strand a
   * stop that every pass skipped over, leaving one long run home at the end.
   * It is used here as a starting point rather than an answer, because it is
   * fast and its weakness is exactly what the relocation pass below repairs.
   *
   * Returns point indices, so the shop's index 0 never appears in the result.
   */
  private planByNearestNeighbour(costs: number[][], stopCount: number): number[] {
    const sequence: number[] = []
    const visited = new Set<number>()

    let current = 0

    while (sequence.length < stopCount) {
      let nearest = -1
      let nearestCost = Number.POSITIVE_INFINITY

      for (let candidate = 1; candidate <= stopCount; candidate++) {
        if (visited.has(candidate)) {
          continue
        }

        if (costs[current][candidate] < nearestCost) {
          nearestCost = costs[current][candidate]
          nearest = candidate
        }
      }

      // Every remaining stop is unreachable from here, so nothing is nearer
      // than anything else. Take them in the order they came rather than
      // ending the route early and losing them.
      if (nearest === -1) {
        nearest = this.firstUnvisited(stopCount, visited)
      }

      visited.add(nearest)
      sequence.push(nearest)
      current = nearest
    }

    return sequence
  }

  /**
   * Improves a route by lifting short runs of stops out and reinserting them
   * wherever they cost least, repeating until no move helps.
   *
   * This is Or-opt, and the choice of it over the more familiar 2-opt is
   * forced by the roads. 2-opt improves a route by reversing a section of it,
   * which assumes driving that section backwards costs what driving it
   * forwards did. On a one-way network that assumption is simply false: the
   * reversed section may be illegal, or cost several times more, and the
   * matrix says so. Or-opt only ever moves a run of stops somewhere else
   * without turning it around, so every route it produces is one that can
   * actually be driven, and every cost it compares is one OSRM really quoted.
   *
   * What it buys in soundness it gives back in reach: because it will not
   * reverse, a route whose cheaper twin is itself driven backwards is a route
   * it cannot get to. That is why {@link planBestOfSeeds} runs it more than
   * once from more than one place rather than trusting a single descent.
   */
  private improveByRelocatingSegments(
    costs: number[][],
    sequence: number[],
    closeTour: boolean
  ): number[] {
    let best = sequence
    let bestCost = this.totalCost(costs, best, closeTour)

    for (let pass = 0; pass < MAX_IMPROVEMENT_PASSES; pass++) {
      let improvedThisPass = false

      for (let length = 1; length <= MAX_RELOCATED_SEGMENT; length++) {
        for (let start = 0; start + length <= best.length; start++) {
          const segment = best.slice(start, start + length)
          const remainder = [...best.slice(0, start), ...best.slice(start + length)]

          for (let insertAt = 0; insertAt <= remainder.length; insertAt++) {
            // Putting it back exactly where it came from is not a move.
            if (insertAt === start) {
              continue
            }

            const candidate = [
              ...remainder.slice(0, insertAt),
              ...segment,
              ...remainder.slice(insertAt),
            ]

            const candidateCost = this.totalCost(costs, candidate, closeTour)

            if (candidateCost < bestCost - MEANINGFUL_IMPROVEMENT) {
              best = candidate
              bestCost = candidateCost
              improvedThisPass = true
            }
          }
        }
      }

      if (!improvedThisPass) {
        break
      }
    }

    return best
  }

  /**
   * Adds up the cost of driving a sequence, starting from the shop.
   *
   * Whether the leg back to the shop counts is the caller's call, and it
   * changes which route wins rather than merely what it is labelled. An open
   * run is free to finish wherever the last stop happens to be, so it will
   * happily end on the far side of the city; a closed one pays for coming
   * home, so it prefers plans that curve back.
   */
  private totalCost(costs: number[][], sequence: number[], closeTour: boolean): number {
    let total = 0
    let previous = 0

    for (const stop of sequence) {
      total += costs[previous][stop]
      previous = stop
    }

    if (closeTour && sequence.length > 0) {
      total += costs[previous][0]
    }

    return total
  }

  /**
   * Builds a symmetric cost matrix from straight-line distances.
   *
   * The fallback for when OSRM is unreachable. It knows nothing about one-way
   * streets — it cannot, since `distance(a, b)` and `distance(b, a)` are the
   * same number by construction — so the plan it feeds is the old quality of
   * answer. It is still chained rather than sorted, which alone puts it ahead
   * of what this service did before.
   */
  private buildStraightLineMatrix(points: RoutePoint[]): TravelMatrix {
    const size = points.length
    const distances: number[][] = []
    const durations: number[][] = []

    for (let row = 0; row < size; row++) {
      distances[row] = []
      durations[row] = []

      for (let column = 0; column < size; column++) {
        const km = this.calculateDistanceInKm(
          points[row].latitude,
          points[row].longitude,
          points[column].latitude,
          points[column].longitude
        )

        distances[row][column] = km * 1000
        durations[row][column] = (km / FALLBACK_SPEED_KMH) * 3600
      }
    }

    return { distances, durations }
  }

  /**
   * A stop that has no address, and so no place on the route.
   */
  private toUnreachableItem(order: RouteOrder): RouteItem {
    return {
      ...order,
      distanceKm: Number.POSITIVE_INFINITY,
      durationMin: Number.POSITIVE_INFINITY,
      legDistanceKm: Number.POSITIVE_INFINITY,
      legDurationMin: Number.POSITIVE_INFINITY,
    }
  }

  private firstUnvisited(stopCount: number, visited: Set<number>): number {
    for (let candidate = 1; candidate <= stopCount; candidate++) {
      if (!visited.has(candidate)) {
        return candidate
      }
    }

    return 1
  }

  private toKm(metres: number): number {
    return Number.isFinite(metres)
      ? Math.round((metres / 1000) * 100) / 100
      : Number.POSITIVE_INFINITY
  }

  private toMinutes(seconds: number): number {
    return Number.isFinite(seconds)
      ? Math.round((seconds / 60) * 10) / 10
      : Number.POSITIVE_INFINITY
  }

  /**
   * Calculates the straight-line distance between two coordinates
   * using the Haversine formula.
   *
   * This method is suitable for distance estimation but does not
   * represent actual road distance. The service-area check still uses it
   * deliberately: that boundary is drawn as a shape on a map, so measuring it
   * as the crow flies is the correct question, and it must stay instant and
   * offline because a customer is waiting on it while typing an address.
   */
  calculateDistanceInKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const earthRadiusKm = 6371
    const dLat = this.toRadians(lat2 - lat1)
    const dLon = this.toRadians(lng2 - lng1)

    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(this.toRadians(lat1)) * Math.cos(this.toRadians(lat2)) * Math.sin(dLon / 2) ** 2

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))

    return Math.round(earthRadiusKm * c * 100) / 100
  }

  private toRadians(degrees: number): number {
    return degrees * (Math.PI / 180)
  }
}
