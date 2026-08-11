import env from '#start/env'
import { setTimeout as sleep } from 'node:timers/promises'

type OverpassElement = {
  lat?: number
  lon?: number
  center?: { lat: number; lon: number }
  tags?: Record<string, string>
}

export type NearbyPlace = {
  latitude: number
  longitude: number
  label: string
  category: string | null
  distance: number
}

const PUBLIC_ENDPOINTS = [
  'https://overpass-api.de/api/interpreter',
  'https://overpass.kumi.systems/api/interpreter',
]

const SELF_HOSTED_URL = env.get('OVERPASS_URL')

const ENDPOINTS = SELF_HOSTED_URL ? [SELF_HOSTED_URL] : PUBLIC_ENDPOINTS

const REQUEST_TIMEOUT = 9000
const USER_AGENT = 'UmimaClean/1.0 (+https://skripsi.r3p.dev)'
const MIN_REQUEST_INTERVAL = SELF_HOSTED_URL ? 0 : 1100
const CACHE_TTL = 3_600_000
const CACHE_LIMIT = 200
const RADIUS = 400
const LIMIT = 12

const CATEGORY_LABELS: Record<string, string> = {
  restaurant: 'Restoran',
  cafe: 'Kafe',
  fast_food: 'Kedai',
  school: 'Sekolah',
  university: 'Kampus',
  college: 'Kampus',
  hospital: 'Rumah Sakit',
  clinic: 'Klinik',
  pharmacy: 'Apotek',
  place_of_worship: 'Tempat Ibadah',
  bank: 'Bank',
  fuel: 'SPBU',
  marketplace: 'Pasar',
  hotel: 'Hotel',
  supermarket: 'Supermarket',
  convenience: 'Minimarket',
  mall: 'Mal',
  parking: 'Parkir',
}

const cache = new Map<string, { places: NearbyPlace[]; expiresAt: number }>()

let queue: Promise<unknown> = Promise.resolve()

function enqueue<T>(task: () => Promise<T>): Promise<T> {
  if (MIN_REQUEST_INTERVAL === 0) {
    return task()
  }

  const settle = () => sleep(MIN_REQUEST_INTERVAL)
  const run = queue.then(task, task)

  queue = run.then(settle, settle)

  return run
}

export default class NearbyService {
  async search(latitude: number, longitude: number): Promise<NearbyPlace[]> {
    const key = `${latitude.toFixed(3)},${longitude.toFixed(3)}`
    const cached = cache.get(key)

    if (cached && cached.expiresAt > Date.now()) {
      return cached.places
    }

    const places = await this.#fetchFromOverpass(latitude, longitude)

    if (cache.size >= CACHE_LIMIT) {
      cache.clear()
    }

    cache.set(key, { places, expiresAt: Date.now() + CACHE_TTL })

    return places
  }

  async #fetchFromOverpass(latitude: number, longitude: number): Promise<NearbyPlace[]> {
    const around = `around:${RADIUS},${latitude},${longitude}`
    const query = `[out:json][timeout:20];
      (
        node(${around})["name"]["amenity"];
        node(${around})["name"]["shop"];
        node(${around})["name"]["tourism"];
        way(${around})["name"]["amenity"];
      );
      out center 60;`

    const response = await enqueue(() => this.#request(query))

    if (!response.ok) {
      throw new Error('Layanan lokasi terdekat sedang tidak tersedia.')
    }

    const payload = (await response.json()) as { elements: OverpassElement[] }

    return this.#toPlaces(payload.elements, latitude, longitude)
  }

  #toPlaces(elements: OverpassElement[], latitude: number, longitude: number): NearbyPlace[] {
    const seen = new Set<string>()
    const places: NearbyPlace[] = []

    for (const element of elements) {
      const lat = element.lat ?? element.center?.lat
      const lon = element.lon ?? element.center?.lon
      const name = element.tags?.name

      if (lat === undefined || lon === undefined || !name || seen.has(name)) {
        continue
      }

      seen.add(name)

      const tag = element.tags?.amenity ?? element.tags?.shop ?? element.tags?.tourism ?? null

      places.push({
        latitude: lat,
        longitude: lon,
        label: name,
        category: tag ? (CATEGORY_LABELS[tag] ?? null) : null,
        distance: this.#distance(latitude, longitude, lat, lon),
      })
    }

    return places.sort((a, b) => a.distance - b.distance).slice(0, LIMIT)
  }

  #distance(fromLat: number, fromLon: number, toLat: number, toLon: number): number {
    const radius = 6371000
    const toRadians = (value: number) => (value * Math.PI) / 180

    const deltaLat = toRadians(toLat - fromLat)
    const deltaLon = toRadians(toLon - fromLon)

    const a =
      Math.sin(deltaLat / 2) ** 2 +
      Math.cos(toRadians(fromLat)) * Math.cos(toRadians(toLat)) * Math.sin(deltaLon / 2) ** 2

    return Math.round(radius * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)))
  }

  async #request(query: string): Promise<Response> {
    for (const endpoint of ENDPOINTS) {
      try {
        const response = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'User-Agent': USER_AGENT,
          },
          body: 'data=' + encodeURIComponent(query),
          signal: AbortSignal.timeout(REQUEST_TIMEOUT),
        })

        if (response.ok) {
          return response
        }
      } catch {
        continue
      }
    }

    throw new Error('Layanan lokasi terdekat sedang tidak tersedia.')
  }
}
