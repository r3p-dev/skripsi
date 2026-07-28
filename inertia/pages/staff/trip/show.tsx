import StaffLayout from '@/components/layouts/staff_layout'
import { Button, buttonVariants } from '@/components/ui/button'
import StaticMap from '@/components/organisms/static_map'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Field, FieldError, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import type { Data } from '@/generated/data'
import type { InertiaProps } from '@/types'
import { whatsappUrl } from '@/lib/utils'
import { Form, Link } from '@adonisjs/inertia/react'
import {
  IconArrowLeft,
  IconLock,
  IconMapPin,
  IconNavigation,
  IconPhone,
  IconUser,
} from '@tabler/icons-react'

type TripType = 'pickup' | 'delivery'

type PageProps = InertiaProps<{
  type: TripType
  order: Data.Order
  blocked: boolean
}>

const typeLabels: Record<TripType, string> = {
  pickup: 'Penjemputan',
  delivery: 'Pengantaran',
}

export default function Show({ type, order, blocked }: PageProps) {
  return (
    <StaffLayout title={`${typeLabels[type]} - ${order.orderNumber}`} description="Detail tugas">
      {/*
        No back link on purpose: claiming a task holds it against everyone
        else, so it has to be finished or cancelled rather than abandoned.
        A blocked task is the exception — nothing was claimed.
      */}
      <div className="flex items-center gap-3 px-6 py-5">
        {blocked && (
          <Link
            route="staff.trip.index"
            className="flex size-9 items-center justify-center rounded-full border border-gray-300 text-black transition-colors hover:bg-gray-100 active:scale-95"
          >
            <IconArrowLeft className="size-5" />
          </Link>
        )}
        <div>
          <p className="text-xs tracking-[0.3em] text-gray-600 uppercase font-medium">
            {typeLabels[type]}
          </p>
          <h1 className="text-2xl font-bold tracking-tight text-black">{order.orderNumber}</h1>
        </div>
      </div>

      <div className="flex-1 space-y-4 px-6 pb-28">
        {blocked ? (
          <Card className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-gray-300 bg-gray-50 px-6 py-16 text-center">
            <IconLock className="size-8 text-gray-500" />
            <div className="space-y-1">
              <p className="text-base font-semibold text-black">Sedang diproses petugas lain</p>
              <p className="text-sm text-gray-600">
                Tugas ini sedang ditangani oleh petugas lain. Silakan pilih tugas lain dari antrean.
              </p>
            </div>
          </Card>
        ) : (
          <>
            <Card className="rounded-2xl border border-gray-200 bg-gray-50 p-5">
              <div className="flex items-center justify-between gap-2">
                <p className="text-xs tracking-widest text-gray-500 uppercase">Status Pesanan</p>
                <p className="text-sm font-semibold text-black">{order.status}</p>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Jadwal Jemput</span>
                <span className="font-medium text-black">{order.pickupDate ?? '-'}</span>
              </div>
            </Card>

            {order.address && (
              <>
                <div className="overflow-hidden rounded-2xl border border-gray-200">
                  <StaticMap
                    latitude={order.address.latitude}
                    longitude={order.address.longitude}
                  />
                </div>

                <Card className="rounded-2xl border border-gray-200 bg-gray-50">
                  <CardHeader>
                    <p className="text-xs tracking-widest text-gray-600 uppercase font-medium">
                      Alamat
                    </p>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-start gap-3">
                      <IconUser className="mt-0.5 size-4 shrink-0 text-gray-500" />
                      <p className="text-sm font-medium text-black">{order.address.name}</p>
                    </div>
                    <div className="flex items-start gap-3">
                      <IconPhone className="mt-0.5 size-4 shrink-0 text-gray-500" />
                      <a
                        href={whatsappUrl(order.address.phone)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-gray-700 underline underline-offset-4"
                      >
                        {order.address.phone}
                      </a>
                    </div>
                    <div className="flex items-start gap-3">
                      <IconMapPin className="mt-0.5 size-4 shrink-0 text-gray-500" />
                      <p className="text-sm leading-relaxed text-gray-700">
                        {order.address.street}
                      </p>
                    </div>

                    {/*
                      Turn-by-turn is handed off to Google Maps rather than
                      rebuilt here — the driver already has it installed and it
                      knows the roads. `dir` starts navigation from wherever
                      they are now.
                    */}
                    <a
                      href={`https://www.google.com/maps/dir/?api=1&destination=${order.address.latitude},${order.address.longitude}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={buttonVariants({
                        className:
                          'h-12 w-full rounded-xl bg-black text-base font-semibold tracking-wide text-white hover:bg-black/90 active:scale-95',
                      })}
                    >
                      <IconNavigation className="size-5" />
                      Buka di Google Maps
                    </a>
                  </CardContent>
                </Card>
              </>
            )}

            <Form
              route="staff.trip.update"
              routeParams={{ number: order.orderNumber, type }}
              className="space-y-4"
            >
              {({ errors, processing }) => (
                <>
                  <Field data-invalid={errors.photo ? 'true' : undefined}>
                    <FieldLabel
                      htmlFor="photo"
                      className="text-xs tracking-widest text-gray-700 uppercase"
                    >
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
                      className="h-12 rounded-xl border-gray-300 bg-white px-3 focus-visible:border-black focus-visible:ring-black/10"
                    />
                    <FieldError>{errors.photo}</FieldError>
                  </Field>

                  <Button
                    type="submit"
                    disabled={processing}
                    className="h-12 w-full rounded-xl bg-black text-base font-semibold tracking-wide text-white hover:bg-black/90 active:scale-95"
                  >
                    Selesaikan Tugas
                  </Button>
                </>
              )}
            </Form>

            <Form route="staff.trip.destroy" routeParams={{ number: order.orderNumber, type }}>
              {({ processing }) => (
                <Button
                  type="submit"
                  disabled={processing}
                  variant="outline"
                  className="h-12 w-full rounded-xl text-base font-semibold tracking-wide text-black active:scale-95"
                >
                  Batalkan Tugas
                </Button>
              )}
            </Form>
          </>
        )}
      </div>
    </StaffLayout>
  )
}
