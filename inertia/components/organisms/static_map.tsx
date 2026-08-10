import L from 'leaflet'
import { useEffect } from 'react'
import { MapContainer, Marker, Popup, TileLayer, useMap } from 'react-leaflet'

type StaticMapProps = {
  latitude: number
  longitude: number
  height?: number | string
}

function ResizeOnMount() {
  const map = useMap()

  useEffect(() => {
    const frame = requestAnimationFrame(() => map.invalidateSize())

    return () => cancelAnimationFrame(frame)
  }, [map])

  return null
}

export default function StaticMap({ latitude, longitude, height = '350px' }: StaticMapProps) {
  return (
    <div style={{ height, width: '100%' }} role="application" aria-label="Interactive location map">
      <MapContainer
        center={new L.LatLng(latitude, longitude)}
        zoom={18}
        dragging={false}
        touchZoom={false}
        scrollWheelZoom={false}
        zoomControl={false}
        doubleClickZoom={false}
        keyboard={false}
        style={{
          height: '100%',
          width: '100%',
          position: 'relative',
          zIndex: 0,
        }}
      >
        <TileLayer
          attribution="Google Maps Satellite"
          url="https://www.google.com/maps/vt?lyrs=s@189&gl=cn&x={x}&y={y}&z={z}"
        />
        <Marker position={new L.LatLng(latitude, longitude)}>
          <Popup>Ini adalah lokasi yang ditandai pada peta.</Popup>
        </Marker>

        <ResizeOnMount />
      </MapContainer>
    </div>
  )
}
