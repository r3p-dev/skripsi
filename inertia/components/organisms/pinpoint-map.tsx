import { Icon, latLng, LatLng } from 'leaflet'
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png'
import markerIcon from 'leaflet/dist/images/marker-icon.png'
import markerShadow from 'leaflet/dist/images/marker-shadow.png'
import { useEffect, useState } from 'react'
import {
  LayersControl,
  MapContainer,
  Marker,
  Popup,
  TileLayer,
  useMap,
  useMapEvents,
} from 'react-leaflet'
import { toast } from 'sonner'

interface MapProps {
  position: LatLng
  onPositionChange?: (position: LatLng) => void
  onRadiusChange?: (radius: number) => void
  disableAutoLocation?: boolean
}

const customIcon = new Icon({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
})

function MapCenterWatcher({ onCenterChange }: { onCenterChange: (latlng: LatLng) => void }) {
  const map = useMapEvents({
    move: () => {
      const center = map.getCenter()
      onCenterChange(center)
    },
  })
  return null
}

function CenteredMarker({
  popupText,
  position,
  onRadiusChange,
}: {
  popupText: string
  position: LatLng
  onRadiusChange?: (radius: number) => void
}) {
  const CENTER = latLng(-6.9555305, 107.6540353)
  const userPos = latLng(position)
  const distance = userPos.distanceTo(CENTER)

  useEffect(() => {
    onRadiusChange?.(distance)
  }, [distance])

  return (
    <Marker position={position} icon={customIcon}>
      <Popup>{popupText}</Popup>
    </Marker>
  )
}

function MapViewUpdater({ center }: { center: LatLng }) {
  const map = useMap()

  useEffect(() => {
    map.setView(center)
  }, [center, map])

  return null
}

export default function PinpointMap({
  position,
  onPositionChange,
  onRadiusChange,
  disableAutoLocation = false,
}: MapProps) {
  const [isDefaultLocation, setIsDefaultLocation] = useState<boolean>(true)
  const [mapCenter, setMapCenter] = useState<LatLng>(position)

  useEffect(() => {
    if (!disableAutoLocation) {
      getCurrentLocation()
    } else {
      setMapCenter(position)
      setIsDefaultLocation(false)
    }
  }, [disableAutoLocation])

  function getCurrentLocation() {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const { latitude, longitude } = pos.coords
          const coords = latLng(latitude, longitude)
          setMapCenter(coords)
          onPositionChange?.(coords)
          setIsDefaultLocation(false)
          toast.success('Berhasil mendapatkan lokasi Anda')
        },
        () => {
          toast.error('Gagal mendapatkan lokasi')
          setMapCenter(position)
          onPositionChange?.(position)
          setIsDefaultLocation(true)
        }
      )
    } else {
      toast.error('Browser Anda tidak mendukung geolokasi. Menggunakan lokasi default.')
      setMapCenter(position)
      onPositionChange?.(position)
      setIsDefaultLocation(true)
    }
  }

  function handleCenterChange(newCenter: LatLng) {
    setMapCenter(newCenter)
    onPositionChange?.(newCenter)
  }

  return (
    <div
      style={{ height: '400px', width: '100%' }}
      role="application"
      aria-label="Interactive location map"
    >
      <MapContainer
        center={mapCenter}
        zoom={18}
        scrollWheelZoom={true}
        style={{
          height: '100%',
          width: '100%',
          position: 'relative',
          zIndex: 0,
        }}
      >
        <LayersControl position="topright">
          <LayersControl.BaseLayer name="Default">
            <TileLayer
              attribution="Google Maps"
              url="https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}"
            />
          </LayersControl.BaseLayer>
          <LayersControl.BaseLayer checked name="Satellite">
            <TileLayer
              attribution="Google Maps Satellite"
              url="https://mt1.google.com/vt/lyrs=s&x={x}&y={y}&z={z}"
            />
          </LayersControl.BaseLayer>
        </LayersControl>
        <MapViewUpdater center={mapCenter} />
        <MapCenterWatcher onCenterChange={handleCenterChange} />
        <CenteredMarker
          position={mapCenter}
          popupText={isDefaultLocation ? 'Lokasi Umima Clean' : 'Lokasi Anda Sekarang'}
          onRadiusChange={onRadiusChange}
        />
      </MapContainer>
    </div>
  )
}
