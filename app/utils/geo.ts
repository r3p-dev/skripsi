export type Position = [longitude: number, latitude: number]

export type PolygonRing = Position[]

export type PolygonGeometry = {
  type: 'Polygon'
  coordinates: PolygonRing[]
}

export type Feature = {
  type: 'Feature'
  properties?: Record<string, unknown> & { Name?: string }
  geometry: PolygonGeometry
}

export type FeatureCollection = {
  type: 'FeatureCollection'
  features: Feature[]
}
