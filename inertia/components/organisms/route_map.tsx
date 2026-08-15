import L from 'leaflet'
import { useEffect } from 'react'
import { MapContainer, Marker, Polyline, TileLayer, useMap } from 'react-leaflet'

export type RouteGeometry = [longitude: number, latitude: number][]

type RouteMapProps = {
  latitude: number
  longitude: number
  geometry: RouteGeometry
  height?: number | string
}

function FitToRoute({ bounds }: { bounds: L.LatLngBounds }) {
  const map = useMap()

  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      map.invalidateSize()
      map.fitBounds(bounds, { padding: [24, 24] })
    })

    return () => cancelAnimationFrame(frame)
  }, [map, bounds])

  return null
}

export default function RouteMap({
  latitude,
  longitude,
  geometry,
  height = '350px',
}: RouteMapProps) {
  const path = geometry.map(([lng, lat]) => new L.LatLng(lat, lng))
  const destination = new L.LatLng(latitude, longitude)
  const bounds = L.latLngBounds(path.length > 1 ? path : [destination, destination])

  return (
    <div style={{ height, width: '100%' }} role="application" aria-label="Peta rute perjalanan">
      <MapContainer
        bounds={bounds}
        scrollWheelZoom={false}
        style={{ height: '100%', width: '100%', position: 'relative', zIndex: 0 }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <Polyline positions={path} pathOptions={{ color: '#1c1c1c', weight: 5, opacity: 0.85 }} />

        {path.length > 1 && <Marker position={path[0]} />}
        <Marker position={destination} />

        <FitToRoute bounds={bounds} />
      </MapContainer>
    </div>
  )
}
