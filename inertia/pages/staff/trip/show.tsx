import StaffLayout from '@/components/layouts/staff_layout'
import { buttonVariants } from '@/components/ui/button'
import StaticMap from '@/components/organisms/static_map'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Field, FieldError, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import type { Data } from '@/generated/data'
import type { InertiaProps } from '@/types'
import { telUrl, whatsappUrl } from '@/lib/utils'
import { OrderStatusLabel } from '@/enums/order_enum'
import { formatDate } from '@/lib/format'
import { ConfirmDialog, ConfirmFooter } from '@/components/molecules/confirm_action'
import { Form, Link } from '@adonisjs/inertia/react'
import {
  IconArrowLeft,
  IconBrandWhatsapp,
  IconLock,
  IconMapPin,
  IconNavigation,
  IconPhone,
  IconPhoneCall,
  IconUser,
} from '@tabler/icons-react'

type TripType = 'pickup' | 'delivery'

type PageProps = InertiaProps<{
  type: TripType
  order: Data.Order.Variants['toDetail']
  blocked: boolean
}>

const typeLabels: Record<TripType, string> = {
  pickup: 'Penjemputan',
  delivery: 'Pengantaran',
}

export default function Show({ type, order, blocked }: PageProps) {
  return (
    <StaffLayout title={`${typeLabels[type]} - ${order.orderNumber}`} description="Detail tugas">
      <div className="flex items-center gap-3 px-6 py-5">
        {blocked && (
          <Link
            route="staff.trip.index"
            className="flex size-11 shrink-0 items-center justify-center rounded-full border border-rule-field text-ink transition-colors hover:bg-paper-tint active:scale-95"
          >
            <IconArrowLeft className="size-5" />
          </Link>
        )}
        <div>
          <p className="text-xs tracking-[0.3em] text-ink-soft uppercase font-medium">
            {typeLabels[type]}
          </p>
          <h1 className="text-2xl font-bold tracking-tight text-ink">{order.orderNumber}</h1>
        </div>
      </div>

      <div className="flex-1 space-y-4 px-6 pb-nav">
        {blocked ? (
          <Card className="flex flex-col items-center gap-3 rounded-none border border-dashed border-rule-field bg-paper-tint px-6 py-16 text-center">
            <IconLock className="size-8 text-ink-subtle" />
            <div className="space-y-1">
              <p className="text-base font-semibold text-ink">Sedang diproses petugas lain</p>
              <p className="text-sm text-ink-soft">
                Tugas ini sedang ditangani oleh petugas lain. Silakan pilih tugas lain dari antrean.
              </p>
            </div>
          </Card>
        ) : (
          <>
            <Card className="rounded-none border border-rule bg-paper-tint p-5">
              <div className="flex items-center justify-between gap-2">
                <p className="text-xs tracking-widest text-ink-subtle uppercase">Status Pesanan</p>
                <p className="text-sm font-semibold text-ink">
                  {OrderStatusLabel[order.status as keyof typeof OrderStatusLabel]}
                </p>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-ink-soft">Jadwal Jemput</span>
                <span className="font-medium text-ink">{formatDate(order.pickupDate)}</span>
              </div>
            </Card>

            {order.address && (
              <>
                <div className="overflow-hidden rounded-none border border-rule">
                  <StaticMap
                    latitude={order.address.latitude}
                    longitude={order.address.longitude}
                  />
                </div>

                <Card className="rounded-none border border-rule bg-paper-tint">
                  <CardHeader>
                    <p className="text-xs tracking-widest text-ink-soft uppercase font-medium">
                      Alamat
                    </p>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-start gap-3">
                      <IconUser className="mt-0.5 size-4 shrink-0 text-ink-subtle" />
                      <p className="text-sm font-medium text-ink">{order.address.name}</p>
                    </div>
                    <div className="flex items-start gap-3">
                      <IconPhone className="mt-0.5 size-4 shrink-0 text-ink-subtle" />
                      <p className="text-sm text-ink-body">{order.address.phone}</p>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <a
                        href={telUrl(order.address.phone)}
                        className={buttonVariants({
                          variant: 'outline',
                          className:
                            'h-11 rounded-none text-sm font-semibold tracking-wide text-ink active:scale-95',
                        })}
                      >
                        <IconPhoneCall className="size-4" />
                        Telepon
                      </a>
                      <a
                        href={whatsappUrl(order.address.phone)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={buttonVariants({
                          variant: 'outline',
                          className:
                            'h-11 rounded-none text-sm font-semibold tracking-wide text-ink active:scale-95',
                        })}
                      >
                        <IconBrandWhatsapp className="size-4" />
                        WhatsApp
                      </a>
                    </div>
                    <div className="flex items-start gap-3">
                      <IconMapPin className="mt-0.5 size-4 shrink-0 text-ink-subtle" />
                      <p className="text-sm leading-relaxed text-ink-body">
                        {order.address.street}
                      </p>
                    </div>

                    <a
                      href={`https://www.google.com/maps/dir/?api=1&destination=${order.address.latitude},${order.address.longitude}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={buttonVariants({
                        className:
                          'h-12 w-full rounded-none bg-ink text-base font-semibold tracking-wide text-white hover:bg-ink/90 active:scale-95',
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
              id="complete-task"
              route="staff.trip.update"
              routeParams={{ number: order.orderNumber, type }}
              className="space-y-4"
            >
              {({ errors, processing }) => (
                <>
                  <Field data-invalid={errors.photo ? 'true' : undefined}>
                    <FieldLabel
                      htmlFor="photo"
                      className="text-xs tracking-widest text-ink-body uppercase"
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
                      className="h-12 rounded-none border-rule-field bg-white px-3 focus-visible:border-ink focus-visible:ring-black/10"
                    />
                    <FieldError>{errors.photo}</FieldError>
                  </Field>

                  <ConfirmDialog
                    triggerClassName="h-12 w-full rounded-none bg-ink text-base font-semibold tracking-wide text-white transition-colors hover:bg-ink/90 active:scale-95"
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
              triggerClassName="inline-flex h-12 w-full items-center justify-center rounded-none border border-rule-field text-base font-semibold tracking-wide text-ink transition-colors hover:bg-paper-tint active:scale-95"
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
