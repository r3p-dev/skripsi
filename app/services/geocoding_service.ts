import type { AreaBounds } from '#services/address_service'
import { setTimeout as sleep } from 'node:timers/promises'

type NominatimResult = {
  lat: string
  lon: string
  display_name: string
}

export type GeocodeResult = {
  latitude: number
  longitude: number
  label: string
}

const ENDPOINT = 'https://nominatim.openstreetmap.org/search'
const USER_AGENT = 'UmimaClean/1.0 (+https://umimaclean.id)'
const MIN_REQUEST_INTERVAL = 1100
const CACHE_TTL = 86_400_000
const CACHE_LIMIT = 500
const CANDIDATE_LIMIT = 5

const cache = new Map<string, { results: GeocodeResult[]; expiresAt: number }>()
let nextRequestAt = 0

export default class GeocodingService {
  async search(query: string, bounds: AreaBounds | null = null): Promise<GeocodeResult[]> {
    const key = query.trim().toLowerCase()
    const cached = cache.get(key)

    if (cached && cached.expiresAt > Date.now()) {
      return cached.results
    }

    const results = await this.#fetchFromNominatim(key, bounds)

    if (cache.size >= CACHE_LIMIT) {
      cache.clear()
    }

    cache.set(key, { results, expiresAt: Date.now() + CACHE_TTL })

    return results
  }

  async #fetchFromNominatim(query: string, bounds: AreaBounds | null): Promise<GeocodeResult[]> {
    await this.#waitForSlot()

    const url = new URL(ENDPOINT)
    url.searchParams.set('q', query)
    url.searchParams.set('format', 'jsonv2')
    url.searchParams.set('limit', String(CANDIDATE_LIMIT))
    url.searchParams.set('countrycodes', 'id')
    url.searchParams.set('accept-language', 'id')

    if (bounds) {
      url.searchParams.set(
        'viewbox',
        [bounds.minLongitude, bounds.maxLatitude, bounds.maxLongitude, bounds.minLatitude].join(',')
      )
    }

    let response: Response

    try {
      response = await fetch(url, {
        headers: {
          'User-Agent': USER_AGENT,
          'Accept': 'application/json',
        },
        signal: AbortSignal.timeout(8000),
      })
    } catch {
      throw new Error('Tidak dapat terhubung ke layanan pencarian lokasi.')
    }

    if (!response.ok) {
      throw new Error('Layanan pencarian lokasi sedang tidak tersedia.')
    }

    const results = (await response.json()) as NominatimResult[]

    return results.map((result) => ({
      latitude: Number(result.lat),
      longitude: Number(result.lon),
      label: result.display_name,
    }))
  }

  async #waitForSlot(): Promise<void> {
    const now = Date.now()
    const startAt = Math.max(now, nextRequestAt)

    nextRequestAt = startAt + MIN_REQUEST_INTERVAL

    if (startAt > now) {
      await sleep(startAt - now)
    }
  }
}
