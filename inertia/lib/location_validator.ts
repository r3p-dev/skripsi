const LATITUDE = -6.9555305
const LONGITUDE = 107.6540353

const SERVICE_LIMITS = {
  north: 30,
  south: 10,
  east: 30,
  west: 20,
}

function toRadians(degrees: number) {
  return degrees * (Math.PI / 180)
}

function calculateAllowedDistance(
  latDiff: number,
  lngDiff: number,
  limits: {
    north: number
    south: number
    east: number
    west: number
  }
) {
  const totalLatDiff = Math.abs(latDiff)
  const totalLngDiff = Math.abs(lngDiff)
  const totalDiff = totalLatDiff + totalLngDiff

  if (totalDiff === 0) return Math.max(...Object.values(limits))

  const latRatio = totalLatDiff / totalDiff
  const lngRatio = totalLngDiff / totalDiff

  const verticalLimit = latDiff > 0 ? limits.north : limits.south
  const horizontalLimit = lngDiff > 0 ? limits.east : limits.west

  return Math.sqrt(Math.pow(verticalLimit * latRatio, 2) + Math.pow(horizontalLimit * lngRatio, 2))
}

export function validateLocation(latitude: number, longitude: number) {
  const latDiff = latitude - LATITUDE
  const lngDiff = longitude - LONGITUDE

  const R = 6371 // Earth's radius in kilometers
  const dLat = toRadians(latitude - LATITUDE)
  const dLon = toRadians(longitude - LONGITUDE)

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(LATITUDE)) *
      Math.cos(toRadians(latitude)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2)

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))

  const distance = R * c
  const totalDistance = Math.round(distance * 100) / 100
  const maxAllowedDistance = calculateAllowedDistance(latDiff, lngDiff, SERVICE_LIMITS)

  const isValid = totalDistance <= maxAllowedDistance
  if (!isValid) {
    return {
      valid: false,
      message: 'Lokasi berada di luar area layanan',
      distance: totalDistance,
      limit: maxAllowedDistance,
    }
  }

  return { valid: true, distance: totalDistance, limit: maxAllowedDistance }
}
