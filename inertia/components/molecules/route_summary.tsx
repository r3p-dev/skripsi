import type { RouteGeometry } from '@/components/organisms/route_map'
import { IconRoute } from '@tabler/icons-react'

export type TripRoute = {
  distance: number
  duration: number
  geometry: RouteGeometry
  source: 'osrm' | 'haversine'
}

export function RouteSummary({ route }: { route: TripRoute }) {
  const km = (route.distance / 1000).toFixed(1)
  const minutes = Math.max(1, Math.round(route.duration / 60))

  return (
    <div className="flex items-center justify-between gap-3 border border-rule bg-paper-tint px-5 py-3.5">
      <span className="flex items-center gap-2 text-small leading-normal text-ink-soft">
        <IconRoute className="size-4" />
        {route.source === 'osrm' ? 'Rute jalan' : 'Perkiraan garis lurus'}
      </span>
      <span className="text-small leading-normal font-semibold text-ink">
        {km} km · {minutes} mnt
      </span>
    </div>
  )
}
