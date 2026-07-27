import StaffLayout from '@/components/layouts/staff_layout'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import type { Data } from '@/generated/data'
import type { InertiaProps } from '@/types'
import { Link } from '@adonisjs/inertia/react'
import { IconMapPin, IconPackage, IconPlus, IconTruckDelivery } from '@tabler/icons-react'

type PageProps = InertiaProps<{
  today: Data.RouteItem[]
  missed: Data.RouteItem[]
}>

function TripCard({ item }: { item: Data.RouteItem }) {
  const isDelivery = item.type === 'delivery'

  return (
    <Link
      route="staff.trip.show"
      routeParams={{ number: item.orderNumber, type: item.type }}
      className="block"
    >
      <Card className="rounded-2xl border border-gray-300 bg-gray-50 p-5 transition-colors hover:bg-gray-100 active:scale-95">
        <div className="flex items-center justify-between gap-2">
          <p className="text-sm font-bold tracking-wide text-black">{item.orderNumber}</p>
          <Badge
            className={isDelivery ? 'bg-blue-100 text-blue-700' : 'bg-amber-100 text-amber-700'}
          >
            {isDelivery ? (
              <IconTruckDelivery className="size-3" />
            ) : (
              <IconPackage className="size-3" />
            )}
            {isDelivery ? 'Antar' : 'Jemput'}
          </Badge>
        </div>

        {item.address && (
          <div className="flex items-start gap-2">
            <IconMapPin className="mt-0.5 size-4 shrink-0 text-gray-500" />
            <div>
              <p className="text-sm font-medium text-black">{item.address.name}</p>
              <p className="text-xs text-gray-600">{item.address.phone}</p>
              <p className="text-sm leading-relaxed text-gray-700">{item.address.street}</p>
            </div>
          </div>
        )}

        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600">Jadwal: {item.pickupDate ?? '-'}</span>
          <span className="font-semibold text-black">{item.distanceKm} km</span>
        </div>
      </Card>
    </Link>
  )
}

function TripSection({ title, items }: { title: string; items: Data.RouteItem[] }) {
  if (items.length === 0) return null

  return (
    <div className="space-y-3">
      <p className="text-xs tracking-widest text-gray-600 uppercase font-medium">{title}</p>
      <div className="space-y-4">
        {items.map((item) => (
          <TripCard key={item.id} item={item} />
        ))}
      </div>
    </div>
  )
}

export default function Index({ today, missed }: PageProps) {
  const isEmpty = today.length === 0 && missed.length === 0

  return (
    <StaffLayout title="Tugas" description="Daftar tugas penjemputan dan pengantaran">
      <div className="flex items-center justify-between gap-3 px-6 py-5">
        <div>
          <p className="text-xs tracking-[0.3em] text-gray-600 uppercase font-medium">Tugas</p>
          <h1 className="text-3xl font-bold tracking-tight text-black">Antrean Rute</h1>
        </div>

        <Link
          route="staff.order.create"
          aria-label="Buat pesanan offline"
          className="flex size-9 shrink-0 items-center justify-center rounded-full bg-black text-white transition-all hover:bg-black/90 active:scale-95"
        >
          <IconPlus className="size-5" />
        </Link>
      </div>

      <div className="flex-1 space-y-6 px-6 pb-28">
        {isEmpty ? (
          <Card className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-gray-300 bg-gray-50 px-6 py-16 text-center">
            <p className="text-base font-semibold text-black">Tidak ada tugas</p>
            <p className="text-sm text-gray-600">Belum ada penjemputan atau pengantaran hari ini</p>
          </Card>
        ) : (
          <>
            <TripSection title="Terlewat" items={missed} />
            <TripSection title="Hari Ini" items={today} />
          </>
        )}
      </div>
    </StaffLayout>
  )
}
