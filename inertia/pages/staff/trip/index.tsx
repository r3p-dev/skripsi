import StaffLayout from '@/components/layouts/staff_layout'
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert_dialog'
import { Badge } from '@/components/ui/badge'
import { Button, buttonVariants } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Field, FieldError, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import type { Data } from '@/generated/data'
import type { InertiaProps } from '@/types'
import { Form, Link } from '@adonisjs/inertia/react'
import {
  IconMapPin,
  IconPackage,
  IconPlus,
  IconPrinter,
  IconSearch,
  IconTruckDelivery,
  IconWashMachine,
} from '@tabler/icons-react'
import { useState } from 'react'

type PageProps = InertiaProps<{
  trips: Data.RouteItem[]
  inspections: Data.Order[]
  cleanings: Data.Order[]
}>

type TabKey = 'trips' | 'inspections' | 'cleanings'

const EMPTY_MESSAGE: Record<TabKey, string> = {
  trips: 'Belum ada penjemputan atau pengantaran',
  inspections: 'Belum ada barang yang menunggu inspeksi',
  cleanings: 'Belum ada barang yang sedang dicuci',
}

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

function InspectionCard({ order }: { order: Data.Order }) {
  return (
    <Link
      route="staff.inspection.show"
      routeParams={{ number: order.orderNumber }}
      className="block"
    >
      <Card className="rounded-2xl border border-gray-300 bg-gray-50 p-5 transition-colors hover:bg-gray-100 active:scale-95">
        <div className="flex items-center justify-between gap-2">
          <p className="text-sm font-bold tracking-wide text-black">{order.orderNumber}</p>
          <Badge className="bg-purple-100 text-purple-700">
            <IconSearch className="size-3" />
            Inspeksi
          </Badge>
        </div>

        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-700">{order.customerName}</span>
          <span className="text-gray-600">{order.createdAt}</span>
        </div>
      </Card>
    </Link>
  )
}

function CleaningCard({ order }: { order: Data.Order }) {
  /**
   * The photo taken at inspection, shown as the "before" the washer compares
   * their work against. Walk-in orders were never inspected, so they have none.
   */
  const inspectionPhoto = order.actions?.find(
    (action) => action.name === 'Inspeksi Selesai'
  )?.photoPath

  return (
    <Card className="rounded-2xl border border-gray-300 bg-gray-50 p-5">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-bold tracking-wide text-black">{order.orderNumber}</p>
        <Badge className="bg-cyan-100 text-cyan-700">
          <IconWashMachine className="size-3" />
          {order.type}
        </Badge>
      </div>

      <div className="flex items-center justify-between text-sm">
        <span className="text-gray-700">{order.customerName}</span>
        <span className="text-gray-600">{order.items?.length ?? 0} item</span>
      </div>

      <div className="flex items-center gap-2">
        <Link
          route="staff.tag.show"
          routeParams={{ number: order.orderNumber }}
          className={buttonVariants({
            variant: 'outline',
            className: 'h-11 flex-1 rounded-xl text-sm font-semibold text-black active:scale-95',
          })}
        >
          <IconPrinter className="size-4" />
          Cetak Label
        </Link>

        {/*
          Behind a confirmation dialog on purpose: marking a batch washed cannot
          be undone, and the button sits on a list of cards that are easy to
          mis-tap. The "after" photo is collected in the same step.
        */}
        <AlertDialog>
          <AlertDialogTrigger className="h-11 flex-1 rounded-xl bg-black text-sm font-semibold tracking-wide text-white transition-colors hover:bg-black/90 active:scale-95">
            Selesai Dicuci
          </AlertDialogTrigger>

          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Selesai dicuci?</AlertDialogTitle>
              <AlertDialogDescription>
                Pesanan {order.orderNumber} akan lanjut ke pengantaran atau selesai, dan tidak dapat
                dikembalikan ke pencucian.
              </AlertDialogDescription>
            </AlertDialogHeader>

            {inspectionPhoto && (
              <div className="space-y-1.5">
                <p className="text-xs tracking-widest text-gray-600 uppercase">Foto Sebelum</p>
                <img
                  src={inspectionPhoto}
                  alt="Foto inspeksi"
                  className="aspect-video w-full rounded-xl border border-gray-200 object-cover"
                />
              </div>
            )}

            <Form route="staff.cleaning.update" routeParams={{ number: order.orderNumber }}>
              {({ errors, processing }) => (
                <div className="space-y-3">
                  <Field data-invalid={errors.photo ? 'true' : undefined}>
                    <FieldLabel
                      htmlFor={`cleaning-photo-${order.id}`}
                      className="text-xs tracking-widest text-gray-700 uppercase"
                    >
                      Foto Sesudah Dicuci
                    </FieldLabel>
                    <Input
                      id={`cleaning-photo-${order.id}`}
                      name="photo"
                      type="file"
                      accept="image/*"
                      capture="environment"
                      required
                      aria-invalid={!!errors.photo}
                      className="h-12 rounded-xl border-gray-300 bg-white px-3 focus-visible:border-black focus-visible:ring-black/10"
                    />
                    <FieldError>{errors.photo}</FieldError>
                  </Field>

                  <AlertDialogFooter>
                    <AlertDialogCancel className="h-11 rounded-xl text-sm font-semibold">
                      Batal
                    </AlertDialogCancel>
                    <Button
                      type="submit"
                      disabled={processing}
                      className="h-11 rounded-xl bg-black text-sm font-semibold tracking-wide text-white hover:bg-black/90"
                    >
                      Konfirmasi Selesai
                    </Button>
                  </AlertDialogFooter>
                </div>
              )}
            </Form>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </Card>
  )
}

export default function Index({ trips, inspections, cleanings }: PageProps) {
  const [activeTab, setActiveTab] = useState<TabKey>('trips')

  const tabs = [
    { key: 'trips', label: 'Antar Jemput', count: trips.length },
    { key: 'inspections', label: 'Inspeksi', count: inspections.length },
    { key: 'cleanings', label: 'Pencucian', count: cleanings.length },
  ] as const

  const activeCount = tabs.find((tab) => tab.key === activeTab)!.count

  return (
    <StaffLayout title="Tugas" description="Daftar tugas penjemputan, inspeksi, dan pencucian">
      <div className="flex items-center justify-between gap-3 px-6 py-5">
        <div>
          <p className="text-xs tracking-[0.3em] text-gray-600 uppercase font-medium">Tugas</p>
          <h1 className="text-3xl font-bold tracking-tight text-black">Antrean Tugas</h1>
        </div>

        <Link
          route="staff.order.create"
          aria-label="Buat pesanan offline"
          className="flex size-9 shrink-0 items-center justify-center rounded-full bg-black text-white transition-all hover:bg-black/90 active:scale-95"
        >
          <IconPlus className="size-5" />
        </Link>
      </div>

      <div className="flex gap-2 overflow-x-auto px-6 pb-1">
        {tabs.map((tab) => {
          const isActive = tab.key === activeTab

          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key)}
              className={`flex shrink-0 items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition-colors active:scale-95 ${
                isActive ? 'bg-black text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {tab.label}
              <span
                className={`flex min-w-5 items-center justify-center rounded-full px-1.5 text-xs ${
                  isActive ? 'bg-white/20 text-white' : 'bg-white text-gray-700'
                }`}
              >
                {tab.count}
              </span>
            </button>
          )
        })}
      </div>

      <div className="flex-1 space-y-4 px-6 pt-4 pb-28">
        {activeCount === 0 ? (
          <Card className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-gray-300 bg-gray-50 px-6 py-16 text-center">
            <p className="text-base font-semibold text-black">Tidak ada tugas</p>
            <p className="text-sm text-gray-600">{EMPTY_MESSAGE[activeTab]}</p>
          </Card>
        ) : (
          <>
            {activeTab === 'trips' && trips.map((item) => <TripCard key={item.id} item={item} />)}

            {activeTab === 'inspections' &&
              inspections.map((order) => <InspectionCard key={order.id} order={order} />)}

            {activeTab === 'cleanings' &&
              cleanings.map((order) => <CleaningCard key={order.id} order={order} />)}
          </>
        )}
      </div>
    </StaffLayout>
  )
}
