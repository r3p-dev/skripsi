import StaffLayout from '@/components/layouts/staff_layout'
import { boxField } from '@/components/atoms/editorial'
import {
  ClaimPrompt,
  TaskAddress,
  TaskHeader,
  TaskSummary,
} from '@/components/molecules/staff_task'
import { RouteSummary, type TripRoute } from '@/components/molecules/route_summary'
import RouteMap from '@/components/organisms/route_map'
import StaticMap from '@/components/organisms/static_map'
import { Field, FieldError, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import type { Data } from '@/generated/data'
import type { InertiaProps } from '@/types'
import { ConfirmDialog, ConfirmFooter } from '@/components/molecules/confirm_action'
import { Form } from '@adonisjs/inertia/react'
import { IconNavigation } from '@tabler/icons-react'

type TripType = 'pickup' | 'delivery'

type PageProps = InertiaProps<{
  type: TripType
  order: Data.Order.Variants['toDetail']
  route: TripRoute | null
  claimed: boolean
}>

const typeLabels: Record<TripType, string> = {
  pickup: 'Penjemputan',
  delivery: 'Pengantaran',
}

export default function Show({ type, order, route, claimed }: PageProps) {
  return (
    <StaffLayout title={`${typeLabels[type]} - ${order.orderNumber}`} description="Detail tugas">
      <TaskHeader eyebrow={typeLabels[type]} title={order.orderNumber} showBack={!claimed} />

      <div className="gutter flex flex-1 flex-col gap-3 pb-nav">
        <TaskSummary status={order.statusLabel} pickupDate={order.pickupDate ?? '—'} />

        {!claimed ? (
          <ClaimPrompt orderNumber={order.orderNumber}>
            <Form
              id="claim-task"
              route="staff.trip.claim"
              routeParams={{ number: order.orderNumber, type }}
            >
              {({ processing }) => (
                <ConfirmDialog
                  triggerClassName="flex min-h-12 w-full items-center justify-center bg-ink px-4 text-small font-medium tracking-[0.08em] text-white uppercase transition-colors hover:bg-ink/90"
                  label="Mulai Kerjakan Tugas"
                  title={`Ambil tugas ${typeLabels[type].toLowerCase()}?`}
                  description={`Pesanan ${order.orderNumber} akan menjadi tugas Anda selama 3 jam dan hilang dari antrean petugas lain.`}
                >
                  <ConfirmFooter label="Ambil Tugas" processing={processing} formId="claim-task" />
                </ConfirmDialog>
              )}
            </Form>
          </ClaimPrompt>
        ) : (
          <>
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
