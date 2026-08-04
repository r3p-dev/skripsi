import { osrm } from '#config/osrm'

/**
 * A point on the map, written the way the rest of the app writes coordinates.
 */
export type RoutePoint = {
  latitude: number
  longitude: number
}

/**
 * The cost of travelling between every pair of points in one request.
 *
 * Both grids are square and keep the ordering of the points that were asked
 * about, so `durations[i][j]` is the time to drive from point `i` to point
 * `j`. Neither grid is symmetric, and that asymmetry is the entire reason
 * this service exists: on a one-way street `durations[a][b]` is a short hop
 * while `durations[b][a]` is whatever loop the law forces you to drive. No
 * formula over two coordinates can express that, because a formula only ever
 * sees where the points are, never which way the tarmac runs.
 *
 * Pairs the router cannot connect at all come back as `Infinity` rather than
 * as a hole in the grid, so callers can compare costs without null checks.
 */
export type TravelMatrix = {
  /** Driving time in seconds. */
  durations: number[][]
  /** Driving distance in metres. */
  distances: number[][]
}

/**
 * The shape OSRM answers `/table` requests with.
 *
 * Unreachable pairs arrive as `null`, which is why both grids are nullable
 * here and neither is once past {@link OsrmService.toFiniteGrid}.
 */
type OsrmTableResponse = {
  code: string
  message?: string
  durations?: (number | null)[][]
  distances?: (number | null)[][]
}

/**
 * Asks a self-hosted OSRM server what it actually costs to drive between
 * stops, following the real road network and its one-way restrictions.
 */
export default class OsrmService {
  /**
   * Whether the router is configured and allowed to be called.
   */
  get isEnabled(): boolean {
    return osrm.enabled
  }

  /**
   * Fetches the full travel-cost matrix between every pair of points.
   *
   * Returns `null` rather than throwing whenever the matrix cannot be had —
   * the router is switched off, the request is too large, the server is down,
   * or it answered with something unusable. Route planning treats a missing
   * matrix as "fall back to straight lines", and a driver looking at a task
   * board is far better served by approximate ordering than by an error page.
   */
  async fetchTravelMatrix(points: RoutePoint[]): Promise<TravelMatrix | null> {
    // One point has nothing to travel between, and zero has nothing at all.
    if (!this.isEnabled || points.length < 2) {
      return null
    }

    // The router would reject an oversized table anyway; skip the round trip.
    if (points.length > osrm.maxTableSize) {
      return null
    }

    // OSRM reads coordinates longitude-first, which is the reverse of how
    // they are stored, displayed, and written everywhere else in this app.
    const coordinates = points.map((point) => `${point.longitude},${point.latitude}`).join(';')

    const url =
      `${osrm.baseUrl}/table/v1/${osrm.profile}/${coordinates}` + `?annotations=duration,distance`

    let payload: OsrmTableResponse

    try {
      const response = await fetch(url, {
        signal: AbortSignal.timeout(osrm.timeoutMs),
      })

      if (!response.ok) {
        return null
      }

      payload = (await response.json()) as OsrmTableResponse
    } catch {
      // Unreachable, timed out, or not JSON. All the same to the caller.
      return null
    }

    if (payload.code !== 'Ok' || !payload.durations || !payload.distances) {
      return null
    }

    return {
      durations: this.toFiniteGrid(payload.durations, points.length),
      distances: this.toFiniteGrid(payload.distances, points.length),
    }
  }

  /**
   * Turns OSRM's nullable grid into one that is always square and numeric.
   *
   * A `null` means the router found no path between that pair — an address
   * pinned in the middle of a rice field, say, with no road it can be snapped
   * to. `Infinity` carries the same meaning through the planner's arithmetic
   * without forcing every comparison to test for null first, and it naturally
   * sorts such a stop to the end of the route instead of the front.
   */
  private toFiniteGrid(grid: (number | null)[][], size: number): number[][] {
    return Array.from({ length: size }, (_unusedRow, row) =>
      Array.from({ length: size }, (_unusedColumn, column) => {
        const value = grid[row]?.[column]

        return typeof value === 'number' ? value : Number.POSITIVE_INFINITY
      })
    )
  }
}
