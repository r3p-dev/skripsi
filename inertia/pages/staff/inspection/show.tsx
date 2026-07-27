import StaffLayout from '@/components/layouts/staff_layout'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Field, FieldError, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { ItemCard, useItemRows } from '@/components/organisms/item_fields'
import type { Data } from '@/generated/data'
import type { InertiaProps } from '@/types'
import { Form, Link } from '@adonisjs/inertia/react'
import { IconArrowLeft, IconLock, IconMapPin, IconPhone, IconUser } from '@tabler/icons-react'

type PageProps = InertiaProps<{
  order: Data.Order
  services: Data.Service[]
  blocked: boolean
}>

export default function Show({ order, services, blocked }: PageProps) {
  const { items, addItem, removeItem, setServiceId } = useItemRows()

  return (
    <StaffLayout title={`Inspeksi - ${order.orderNumber}`} description="Detail tugas inspeksi">
      <div className="flex items-center gap-3 px-6 py-5">
        <Link
          route="staff.trip.index"
          className="flex size-9 items-center justify-center rounded-full border border-gray-300 text-black transition-colors hover:bg-gray-100 active:scale-95"
        >
          <IconArrowLeft className="size-5" />
        </Link>
        <div>
          <p className="text-xs tracking-[0.3em] text-gray-600 uppercase font-medium">Inspeksi</p>
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
                    <p className="text-sm text-gray-700">{order.address.phone}</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <IconMapPin className="mt-0.5 size-4 shrink-0 text-gray-500" />
                    <p className="text-sm leading-relaxed text-gray-700">{order.address.street}</p>
                  </div>
                </CardContent>
              </Card>
            )}

            <Form
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

                  <Button
                    type="submit"
                    disabled={processing}
                    className="h-12 w-full rounded-xl bg-black text-base font-semibold tracking-wide text-white hover:bg-black/90 active:scale-95"
                  >
                    Selesaikan Inspeksi
                  </Button>
                </>
              )}
            </Form>

            <Form route="staff.inspection.destroy" routeParams={{ number: order.orderNumber }}>
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
