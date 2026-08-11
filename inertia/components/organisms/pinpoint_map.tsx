import { IconCurrentLocation } from '@tabler/icons-react'
import { latLng, type LatLng } from 'leaflet'
import { useCallback, useEffect, useRef } from 'react'
import {
  LayersControl,
  MapContainer,
  Polygon,
  TileLayer,
  useMap,
  useMapEvents,
} from 'react-leaflet'
import { toast } from 'sonner'
import markerIcon from 'leaflet/dist/images/marker-icon.png'
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png'
import { isWithinOperationalAreas, toLatLngRings, type OperationalArea } from '@/lib/geo'

type PinpointMapProps = {
  value: LatLng
  onChange: (position: LatLng) => void
  disableAutoLocation?: boolean
  areas?: OperationalArea[]
}

function ChangeView({ center }: { center: LatLng }) {
  const map = useMap()

  useEffect(() => {
    map.setView(center)
  }, [map, center])

  return null
}

function CenterWatcher({ onChange }: { onChange: (position: LatLng) => void }) {
  const map = useMapEvents({
    moveend: () => {
      onChange(map.getCenter())
    },
  })

  return null
}

function LocateButton({ onLocate }: { onLocate: () => void }) {
  return (
    <button
      type="button"
      onClick={onLocate}
      aria-label="Gunakan lokasi saya"
      className="
        absolute
        bottom-4
        right-4
        z-1000
        flex
        size-11
        items-center
        justify-center
        rounded-md
        bg-white
        shadow-lg
        hover:bg-paper-tint
      "
    >
      <IconCurrentLocation size={20} />
    </button>
  )
}

export default function PinpointMap({
  value,
  onChange,
  disableAutoLocation = false,
  areas = [],
}: PinpointMapProps) {
  const autoLocated = useRef(false)
  const isOutside = areas.length > 0 && !isWithinOperationalAreas([value.lng, value.lat], areas)

  const locateUser = useCallback(() => {
    if (!navigator.geolocation) {
      toast.error('Geolocation is not supported')
      return
    }

    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        onChange(latLng(coords.latitude, coords.longitude))
      },
      () => {
        toast.error('Tidak dapat mengambil lokasi Anda. Pastikan izin lokasi diaktifkan.')
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
      }
    )
  }, [onChange])

  useEffect(() => {
    if (disableAutoLocation) return

    if (autoLocated.current) return

    autoLocated.current = true

    locateUser()
  }, [disableAutoLocation, locateUser])

  return (
    <>
      <input type="hidden" name="latitude" value={value.lat} />
      <input type="hidden" name="longitude" value={value.lng} />

      <div
        className="relative isolate"
        style={{
          height: 400,
          width: '100%',
        }}
      >
        <MapContainer
          center={value}
          zoom={18}
          scrollWheelZoom
          style={{
            height: '100%',
            width: '100%',
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

          {areas.map((area) =>
            area.geometry ? (
              <Polygon
                key={area.id}
                positions={toLatLngRings(area.geometry)}
                pathOptions={{
                  color: isOutside ? '#dc2626' : '#16a34a',
                  weight: 2,
                  fillOpacity: 0.1,
                }}
              />
            ) : null
          )}

          <ChangeView center={value} />

          <CenterWatcher onChange={onChange} />
        </MapContainer>

        <div
          className="
          pointer-events-none
          absolute
          left-1/2
          top-1/2
          z-999
        "
          style={{
            transform: 'translate(-50%, -100%)',
          }}
        >
          <img
            src={markerIcon}
            srcSet={`${markerIcon2x} 2x`}
            alt="location pin"
            style={{
              width: 25,
              height: 41,
              filter: isOutside
                ? 'grayscale(1) sepia(1) saturate(6) hue-rotate(-40deg)'
                : undefined,
            }}
          />
        </div>

        <LocateButton onLocate={locateUser} />
      </div>
    </>
  )
}
