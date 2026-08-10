export type GeocodeResult = {
  latitude: number
  longitude: number
  label: string
}

export type GeocodeReason = 'not_found' | 'outside_area' | 'unavailable'

export type GeocodeResponse = {
  result: GeocodeResult | null
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
