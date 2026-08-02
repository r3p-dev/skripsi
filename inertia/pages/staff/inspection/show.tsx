import StaffLayout from '@/components/layouts/staff_layout'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Field, FieldError, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { ItemCard, useItemRows } from '@/components/organisms/item_fields'
import type { Data } from '@/generated/data'
import type { InertiaProps } from '@/types'
import { whatsappUrl } from '@/lib/utils'
import { OrderStatusLabel } from '@/enums/order_status_enum'
import { formatDate } from '@/lib/format'
import { ConfirmDialog, ConfirmFooter } from '@/components/molecules/confirm_action'
import { Form, Link } from '@adonisjs/inertia/react'
import { IconArrowLeft, IconLock, IconMapPin, IconPhone, IconUser } from '@tabler/icons-react'

type PageProps = InertiaProps<{
  order: Data.Order.Variants['toDetail']
  services: Data.Service[]
  blocked: boolean
}>

export default function Show({ order, services, blocked }: PageProps) {
  const { items, addItem, removeItem, setServiceId } = useItemRows()

  return (
    <StaffLayout title={`Inspeksi - ${order.orderNumber}`} description="Detail tugas inspeksi">
      {/*
        No back link on purpose: claiming a task holds it against everyone
        else, so it has to be finished or cancelled rather than abandoned.
        A blocked task is the exception — nothing was claimed.
      */}
      <div className="flex items-center gap-3 px-6 py-5">
        {blocked && (
          <Link
            route="staff.trip.index"
            className="flex size-11 shrink-0 items-center justify-center rounded-full border border-gray-300 text-black transition-colors hover:bg-gray-100 active:scale-95"
          >
            <IconArrowLeft className="size-5" />
          </Link>
        )}
        <div>
          <p className="text-xs tracking-[0.3em] text-gray-600 uppercase font-medium">Inspeksi</p>
          <h1 className="text-2xl font-bold tracking-tight text-black">{order.orderNumber}</h1>
        </div>
      </div>

      <div className="flex-1 space-y-4 px-6 pb-nav">
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
                <p className="text-sm font-semibold text-black">
                  {OrderStatusLabel[order.status as keyof typeof OrderStatusLabel]}
                </p>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Jadwal Jemput</span>
                <span className="font-medium text-black">{formatDate(order.pickupDate)}</span>
              </div>
            </Card>

            {order.address && (
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
                    <p className="text-sm leading-relaxed text-gray-700">{order.address.street}</p>
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
                    className="h-11 w-full rounded-xl text-sm font-semibold tracking-wide text-black active:scale-95"
                  >
                    Tambah Barang
                  </Button>

                  <Field data-invalid={errors.photo ? 'true' : undefined}>
                    <FieldLabel
                      htmlFor="photo"
                      className="text-xs tracking-widest text-gray-700 uppercase"
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
                      className="h-12 rounded-xl border-gray-300 bg-white px-3 focus-visible:border-black focus-visible:ring-black/10"
                    />
                    <FieldError>{errors.photo}</FieldError>
                  </Field>

                  <ConfirmDialog
                    triggerClassName="h-12 w-full rounded-xl bg-black text-base font-semibold tracking-wide text-white transition-colors hover:bg-black/90 active:scale-95"
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
              triggerClassName="inline-flex h-12 w-full items-center justify-center rounded-xl border border-gray-300 text-base font-semibold tracking-wide text-black transition-colors hover:bg-gray-100 active:scale-95"
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
