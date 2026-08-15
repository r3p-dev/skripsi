import StaffLayout from '@/components/layouts/staff_layout'
import { boxField } from '@/components/atoms/editorial'
import {
  BlockedNotice,
  TaskAddress,
  TaskHeader,
  TaskSummary,
} from '@/components/molecules/staff_task'
import RouteMap, { type RouteGeometry } from '@/components/organisms/route_map'
import StaticMap from '@/components/organisms/static_map'
import { Field, FieldError, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import type { Data } from '@/generated/data'
import type { InertiaProps } from '@/types'
import { OrderStatusLabel } from '@/enums/order_enum'
import { formatDate } from '@/lib/format'
import { ConfirmDialog, ConfirmFooter } from '@/components/molecules/confirm_action'
import { Form } from '@adonisjs/inertia/react'
import { IconNavigation, IconRoute } from '@tabler/icons-react'

type TripType = 'pickup' | 'delivery'

type TripRoute = {
  distance: number
  duration: number
  geometry: RouteGeometry
  source: 'osrm' | 'haversine'
}

type PageProps = InertiaProps<{
  type: TripType
  order: Data.Order.Variants['toDetail']
  route: TripRoute | null
  blocked: boolean
}>

const typeLabels: Record<TripType, string> = {
  pickup: 'Penjemputan',
  delivery: 'Pengantaran',
}

function RouteSummary({ route }: { route: TripRoute }) {
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

export default function Show({ type, order, route, blocked }: PageProps) {
  return (
    <StaffLayout title={`${typeLabels[type]} - ${order.orderNumber}`} description="Detail tugas">
      <TaskHeader eyebrow={typeLabels[type]} title={order.orderNumber} showBack={blocked} />

      <div className="gutter flex flex-1 flex-col gap-3 pb-nav">
        {blocked ? (
          <BlockedNotice />
        ) : (
          <>
            <TaskSummary
              status={OrderStatusLabel[order.status as keyof typeof OrderStatusLabel]}
              pickupDate={formatDate(order.pickupDate)}
            />

            {order.address && (
              <>
                <div className="border border-rule">
                  {route ? (
                    <RouteMap
                      latitude={order.address.latitude}
                      longitude={order.address.longitude}
                      geometry={route.geometry}
                    />
                  ) : (
                    <StaticMap
                      latitude={order.address.latitude}
                      longitude={order.address.longitude}
                    />
                  )}
                </div>

                {route && <RouteSummary route={route} />}

                <TaskAddress address={order.address}>
                  {/*
                    The in-house route above covers the usual case. Google Maps
                    stays available for turn-by-turn voice guidance, and as a
                    way out when the routing service is only guessing.
                  */}
                  <a
                    href={`https://www.google.com/maps/dir/?api=1&destination=${order.address.latitude},${order.address.longitude}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex min-h-12 items-center justify-center gap-2 bg-ink px-4 text-small font-medium tracking-[0.08em] text-white uppercase transition-colors hover:bg-ink/90"
                  >
                    <IconNavigation className="size-5" />
                    Buka di Google Maps
                  </a>
                </TaskAddress>
              </>
            )}

            <Form
              id="complete-task"
              route="staff.trip.update"
              routeParams={{ number: order.orderNumber, type }}
              className="flex flex-col gap-3"
            >
              {({ errors, processing }) => (
                <>
                  <Field data-invalid={errors.photo ? 'true' : undefined}>
                    <FieldLabel htmlFor="photo" className="field-label mb-2">
                      Foto Bukti {typeLabels[type]}
                    </FieldLabel>
                    <Input
                      id="photo"
                      name="photo"
                      type="file"
                      accept="image/*"
                      capture="environment"
                      required
                      aria-invalid={!!errors.photo}
                      className={cn(boxField, 'h-12 py-2.5')}
                    />
                    <FieldError>{errors.photo}</FieldError>
                  </Field>

                  <ConfirmDialog
                    triggerClassName="flex min-h-12 w-full items-center justify-center bg-ink px-4 text-small font-medium tracking-[0.08em] text-white uppercase transition-colors hover:bg-ink/90"
                    label="Selesaikan Tugas"
                    title={`Selesaikan ${typeLabels[type].toLowerCase()}?`}
                    description={`Pesanan ${order.orderNumber} akan lanjut ke tahap berikutnya dan pelanggan akan melihat perubahannya. Tindakan ini tidak dapat dibatalkan.`}
                  >
                    <ConfirmFooter
                      label="Konfirmasi Selesai"
                      processing={processing}
                      formId="complete-task"
                    />
                  </ConfirmDialog>
                </>
              )}
            </Form>

            <ConfirmDialog
              triggerClassName="flex min-h-12 w-full items-center justify-center border border-rule-field px-4 text-small font-medium tracking-[0.08em] text-ink uppercase transition-colors hover:bg-paper-tint"
              label="Batalkan Tugas"
              title="Batalkan tugas ini?"
              description={`Pesanan ${order.orderNumber} akan kembali ke antrean dan bisa diambil petugas lain.`}
            >
              <Form route="staff.trip.destroy" routeParams={{ number: order.orderNumber, type }}>
                {({ processing }) => (
                  <ConfirmFooter label="Batalkan Tugas" processing={processing} destructive />
                )}
              </Form>
            </ConfirmDialog>
          </>
        )}
      </div>
    </StaffLayout>
  )
}
