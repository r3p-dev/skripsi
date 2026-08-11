export type GeocodeResult = {
  latitude: number
  longitude: number
  label: string
}

export type GeocodeReason = 'not_found' | 'outside_area' | 'unavailable'

export type GeocodeResponse = {
  results: GeocodeResult[]
  reason: GeocodeReason | null
}

export const GEOCODE_MESSAGES: Record<GeocodeReason, string> = {
  not_found: 'Alamat tersebut tidak ditemukan. Coba tulis lebih lengkap.',
  outside_area: 'Alamat tersebut berada di luar jangkauan layanan jemput-antar kami.',
  unavailable: 'Pencarian lokasi sedang tidak tersedia. Geser titik pada peta secara manual.',
}

export async function geocode(query: string, signal: AbortSignal): Promise<GeocodeResponse> {
  const url = new URL('/address/geocode', window.location.origin)
  url.searchParams.set('query', query)

  const response = await fetch(url, {
    signal,
    headers: { Accept: 'application/json' },
  })

  if (!response.ok && response.status !== 503) {
    throw new Error('Gagal mencari lokasi.')
  }

  return (await response.json()) as GeocodeResponse
}

export type NearbyPlace = {
  latitude: number
  longitude: number
  label: string
  category: string | null
  distance: number
}

export function formatDistance(metres: number): string {
  return metres < 1000 ? `${metres} m` : `${(metres / 1000).toFixed(1)} km`
}

export async function nearby(
  latitude: number,
  longitude: number,
  signal: AbortSignal
): Promise<NearbyPlace[]> {
  const url = new URL('/address/nearby', window.location.origin)
  url.searchParams.set('latitude', String(latitude))
  url.searchParams.set('longitude', String(longitude))

  const response = await fetch(url, { signal, headers: { Accept: 'application/json' } })

  if (!response.ok && response.status !== 503) {
    throw new Error('Gagal mencari lokasi terdekat.')
  }

  const payload = (await response.json()) as { places: NearbyPlace[] }

  return payload.places
}
