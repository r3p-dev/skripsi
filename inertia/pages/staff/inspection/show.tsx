import StaffLayout from '@/components/layouts/staff_layout'
import { Button, buttonVariants } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Field, FieldError, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { ItemCard, useItemRows } from '@/components/organisms/item_fields'
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
  IconPhone,
  IconPhoneCall,
  IconUser,
} from '@tabler/icons-react'

type PageProps = InertiaProps<{
  order: Data.Order.Variants['toDetail']
  services: Data.Service[]
  blocked: boolean
}>

export default function Show({ order, services, blocked }: PageProps) {
  const { items, addItem, removeItem, setServiceId } = useItemRows()

  return (
    <StaffLayout title={`Inspeksi - ${order.orderNumber}`} description="Detail tugas inspeksi">
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
          <p className="text-xs tracking-[0.3em] text-ink-soft uppercase font-medium">Inspeksi</p>
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
                  <div className="flex items-start gap-3">
                    <IconMapPin className="mt-0.5 size-4 shrink-0 text-ink-subtle" />
                    <p className="text-sm leading-relaxed text-ink-body">{order.address.street}</p>
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
                </CardContent>
              </Card>
            )}

            <Form
              id="complete-inspection"
              route="staff.inspection.update"
              routeParams={{ number: order.orderNumber }}
              className="space-y-4"
            >
              {({ errors, processing }) => (
                <>
                  {items.map((item, index) => (
                    <ItemCard
                      key={item.key}
                      index={index}
                      services={services}
                      item={item}
                      canRemove={items.length > 1}
                      onServiceChange={(serviceId) => setServiceId(item.key, serviceId)}
                      onRemove={() => removeItem(item.key)}
                    />
                  ))}

                  <Button
                    type="button"
                    variant="outline"
                    onClick={addItem}
                    className="h-11 w-full rounded-none text-sm font-semibold tracking-wide text-ink active:scale-95"
                  >
                    Tambah Barang
                  </Button>

                  <Field data-invalid={errors.photo ? 'true' : undefined}>
                    <FieldLabel
                      htmlFor="photo"
                      className="text-xs tracking-widest text-ink-body uppercase"
                    >
                      Foto Bukti Inspeksi
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
                    label="Selesaikan Inspeksi"
                    title="Selesaikan inspeksi?"
                    description={`Harga pesanan ${order.orderNumber} akan dikunci dan pelanggan akan diminta membayar. Rincian barang masih bisa diperbaiki di layar berikutnya.`}
                  >
                    <ConfirmFooter
                      label="Konfirmasi Selesai"
                      processing={processing}
                      formId="complete-inspection"
                    />
                  </ConfirmDialog>
                </>
              )}
            </Form>

            <ConfirmDialog
              triggerClassName="inline-flex h-12 w-full items-center justify-center rounded-none border border-rule-field text-base font-semibold tracking-wide text-ink transition-colors hover:bg-paper-tint active:scale-95"
              label="Batalkan Tugas"
              title="Batalkan tugas ini?"
              description={`Pesanan ${order.orderNumber} akan kembali ke antrean inspeksi dan bisa diambil petugas lain. Data barang yang sudah diisi tidak akan tersimpan.`}
            >
              <Form route="staff.inspection.destroy" routeParams={{ number: order.orderNumber }}>
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
