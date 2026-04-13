import L from 'leaflet'
import { MapContainer, Marker, Popup, TileLayer } from 'react-leaflet'

export default function StaticMap({
  latitude,
  longitude,
}: {
  latitude: number
  longitude: number
}) {
  return (
    <div
      style={{ height: '350px', width: '100%' }}
      role="application"
      aria-label="Interactive location map"
    >
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
      </MapContainer>
    </div>
  )
}
