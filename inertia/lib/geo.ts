export type Position = [longitude: number, latitude: number]

export type PolygonRing = Position[]

export type PolygonGeometry = {
  type: 'Polygon'
  coordinates: PolygonRing[]
}

export type OperationalArea = {
  id: number
  name: string
  geometry: PolygonGeometry | null
}

function isPointInRing(point: Position, ring: PolygonRing): boolean {
  const [x, y] = point
  let inside = false

  for (let current = 0, previous = ring.length - 1; current < ring.length; previous = current++) {
    const [xCurrent, yCurrent] = ring[current]
    const [xPrevious, yPrevious] = ring[previous]

    const straddlesRay = yCurrent > y !== yPrevious > y

    if (!straddlesRay) {
      continue
    }

    const xIntersection =
      ((xPrevious - xCurrent) * (y - yCurrent)) / (yPrevious - yCurrent) + xCurrent

    if (x < xIntersection) {
      inside = !inside
    }
  }

  return inside
}

export function isPointInPolygon(point: Position, geometry: PolygonGeometry): boolean {
  const [boundary, ...holes] = geometry.coordinates

  if (!boundary || !isPointInRing(point, boundary)) {
    return false
  }

  return !holes.some((hole) => isPointInRing(point, hole))
}

export function isWithinOperationalAreas(point: Position, areas: OperationalArea[]): boolean {
  return areas.some((area) => area.geometry !== null && isPointInPolygon(point, area.geometry))
}

export function toCenter(areas: OperationalArea[]): Position | null {
  const boundaries = areas.flatMap((area) => area.geometry?.coordinates[0] ?? [])

  if (boundaries.length === 0) {
    return null
  }

  const longitudes = boundaries.map(([longitude]) => longitude)
  const latitudes = boundaries.map(([, latitude]) => latitude)

  return [
    (Math.min(...longitudes) + Math.max(...longitudes)) / 2,
    (Math.min(...latitudes) + Math.max(...latitudes)) / 2,
  ]
}

export function toLatLngRings(geometry: PolygonGeometry): [number, number][][] {
  return geometry.coordinates.map((ring) =>
    ring.map(([longitude, latitude]) => [latitude, longitude] as [number, number])
  )
}
