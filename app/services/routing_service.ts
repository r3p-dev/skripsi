import env from '#start/env'

export type RoutePoint = {
  latitude: number
  longitude: number
}

export type RouteSource = 'osrm' | 'haversine'

export type RouteStop<T> = {
  stop: T
  distance: number
  duration: number
}

export type RoutePlan<T> = {
  stops: RouteStop<T>[]
  totalDistance: number
  totalDuration: number
  source: RouteSource
}

export type RouteLine = {
  distance: number
  duration: number
  geometry: [longitude: number, latitude: number][]
  source: RouteSource
}

type OsrmTableResponse = {
  code: string
  distances?: (number | null)[][]
  durations?: (number | null)[][]
}

type OsrmRouteResponse = {
  code: string
  routes?: {
    distance: number
    duration: number
    geometry?: { coordinates: [number, number][] }
  }[]
}

const EARTH_RADIUS = 6371000

const ROAD_WINDING_FACTOR = 1.3
const AVERAGE_SPEED_MS = 8.3

const ENABLED = env.get('OSRM_ENABLED') ?? false
const BASE_URL = env.get('OSRM_URL')
const PROFILE = env.get('OSRM_PROFILE') ?? 'driving'
const TIMEOUT = env.get('OSRM_TIMEOUT_MS') ?? 5000

const MAX_TABLE_SIZE = env.get('OSRM_MAX_TABLE_SIZE') ?? 100

export default class RoutingService {
  get isEnabled(): boolean {
    return ENABLED && !!BASE_URL
  }

  async plan<T extends RoutePoint>(origin: RoutePoint, stops: T[]): Promise<RoutePlan<T>> {
    if (stops.length === 0) {
      return { stops: [], totalDistance: 0, totalDuration: 0, source: 'haversine' }
    }

    const points = [origin, ...stops]
    const matrix = await this.#buildMatrix(points)

    return this.#nearestNeighbour(stops, matrix)
  }

  async line(origin: RoutePoint, destination: RoutePoint): Promise<RouteLine> {
    const osrm = await this.#fetchRoute(origin, destination)

    if (osrm) {
      return osrm
    }

    const distance = this.haversine(origin, destination) * ROAD_WINDING_FACTOR

    return {
      distance: Math.round(distance),
      duration: Math.round(distance / AVERAGE_SPEED_MS),
      geometry: [
        [origin.longitude, origin.latitude],
        [destination.longitude, destination.latitude],
      ],
      source: 'haversine',
    }
  }

  haversine(from: RoutePoint, to: RoutePoint): number {
    const toRadians = (value: number) => (value * Math.PI) / 180

    const deltaLat = toRadians(to.latitude - from.latitude)
    const deltaLon = toRadians(to.longitude - from.longitude)

    const a =
      Math.sin(deltaLat / 2) ** 2 +
      Math.cos(toRadians(from.latitude)) *
        Math.cos(toRadians(to.latitude)) *
        Math.sin(deltaLon / 2) ** 2

    return EARTH_RADIUS * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  }

  #nearestNeighbour<T extends RoutePoint>(
    stops: T[],
    matrix: { distances: number[][]; durations: number[][]; source: RouteSource }
  ): RoutePlan<T> {
    const remaining = new Set(stops.map((_, index) => index + 1))
    const ordered: RouteStop<T>[] = []

    let current = 0
    let totalDistance = 0
    let totalDuration = 0

    while (remaining.size > 0) {
      let nearest = -1
      let nearestDistance = Number.POSITIVE_INFINITY

      for (const candidate of remaining) {
        const distance = matrix.distances[current][candidate]

        if (distance < nearestDistance) {
          nearest = candidate
          nearestDistance = distance
        }
      }

      const duration = matrix.durations[current][nearest]

      ordered.push({
        stop: stops[nearest - 1],
        distance: Math.round(nearestDistance),
        duration: Math.round(duration),
      })

      totalDistance += nearestDistance
      totalDuration += duration

      remaining.delete(nearest)
      current = nearest
    }

    return {
      stops: ordered,
      totalDistance: Math.round(totalDistance),
      totalDuration: Math.round(totalDuration),
      source: matrix.source,
    }
  }

  async #buildMatrix(points: RoutePoint[]): Promise<{
    distances: number[][]
    durations: number[][]
    source: RouteSource
  }> {
    const osrm = await this.#fetchTable(points)

    if (osrm) {
      return { ...osrm, source: 'osrm' }
    }

    const distances = points.map((from) =>
      points.map((to) => this.haversine(from, to) * ROAD_WINDING_FACTOR)
    )

    return {
      distances,
      durations: distances.map((row) => row.map((metres) => metres / AVERAGE_SPEED_MS)),
      source: 'haversine',
    }
  }

  async #fetchTable(
    points: RoutePoint[]
  ): Promise<{ distances: number[][]; durations: number[][] } | null> {
    if (!this.isEnabled || points.length > MAX_TABLE_SIZE) {
      return null
    }

    const url = new URL(`${BASE_URL}/table/v1/${PROFILE}/${this.#toCoordinates(points)}`)
    url.searchParams.set('annotations', 'distance,duration')

    const payload = await this.#request<OsrmTableResponse>(url)

    if (payload?.code !== 'Ok' || !payload.distances || !payload.durations) {
      return null
    }

    const distances = this.#solidify(payload.distances, points.length)
    const durations = this.#solidify(payload.durations, points.length)

    if (!distances || !durations) {
      return null
    }

    return { distances, durations }
  }

  async #fetchRoute(origin: RoutePoint, destination: RoutePoint): Promise<RouteLine | null> {
    if (!this.isEnabled) {
      return null
    }

    const path = this.#toCoordinates([origin, destination])
    const url = new URL(`${BASE_URL}/route/v1/${PROFILE}/${path}`)
    url.searchParams.set('overview', 'full')
    url.searchParams.set('geometries', 'geojson')

    const payload = await this.#request<OsrmRouteResponse>(url)
    const route = payload?.routes?.[0]

    if (payload?.code !== 'Ok' || !route?.geometry?.coordinates.length) {
      return null
    }

    return {
      distance: Math.round(route.distance),
      duration: Math.round(route.duration),
      geometry: route.geometry.coordinates,
      source: 'osrm',
    }
  }

  #solidify(matrix: (number | null)[][], size: number): number[][] | null {
    if (matrix.length !== size) {
      return null
    }

    const solid: number[][] = []

    for (const row of matrix) {
      if (row.length !== size || row.some((value) => typeof value !== 'number')) {
        return null
      }

      solid.push(row as number[])
    }

    return solid
  }

  #toCoordinates(points: RoutePoint[]): string {
    return points.map((point) => `${point.longitude},${point.latitude}`).join(';')
  }

  async #request<T>(url: URL): Promise<T | null> {
    try {
      const response = await fetch(url, {
        headers: { Accept: 'application/json' },
        signal: AbortSignal.timeout(TIMEOUT),
      })

      if (!response.ok) {
        return null
      }

      return (await response.json()) as T
    } catch {
      return null
    }
  }
}
