import { PhoneInput } from '@/components/atoms/phone_input'
import StaffLayout from '@/components/layouts/staff_layout'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Field, FieldError, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { ItemCard, useItemRows } from '@/components/organisms/item_fields'
import type { Data } from '@/generated/data'
import type { InertiaProps } from '@/types'
import { Form, Link } from '@adonisjs/inertia/react'
import { IconArrowLeft } from '@tabler/icons-react'

type PageProps = InertiaProps<{
  services: Data.Service[]
}>

const paymentMethods = [
  { value: 'cash', label: 'Tunai' },
  { value: 'debit', label: 'Debit' },
  { value: 'qris', label: 'QRIS' },
] as const

export default function Create({ services }: PageProps) {
  const { items, addItem, removeItem, setServiceId } = useItemRows()

  return (
    <StaffLayout title="Pesanan Offline" description="Buat pesanan offline di tempat">
      <div className="flex items-center gap-3 px-6 py-5">
        <Link
          route="staff.trip.index"
          className="flex size-9 items-center justify-center rounded-full border border-gray-300 text-black transition-colors hover:bg-gray-100 active:scale-95"
        >
          <IconArrowLeft className="size-5" />
        </Link>
        <div>
          <p className="text-xs tracking-[0.3em] text-gray-600 uppercase font-medium">
            Pesanan Offline
          </p>
          <h1 className="text-2xl font-bold tracking-tight text-black">Pesanan Baru</h1>
        </div>
      </div>

      <div className="flex-1 space-y-4 px-6 pb-28">
        <Form route="staff.order.store" className="space-y-4">
          {({ errors, processing }) => (
            <>
              <input type="hidden" name="totalItems" value={items.length} />

              <Card className="rounded-2xl border border-gray-200 bg-gray-50 p-5">
                <Field data-invalid={errors.name ? 'true' : undefined}>
                  <FieldLabel
                    htmlFor="name"
                    className="text-xs tracking-widest text-gray-700 uppercase"
                  >
                    Nama Pelanggan
                  </FieldLabel>
                  <Input
                    id="name"
                    name="name"
                    required
                    aria-invalid={!!errors.name}
                    className="h-11 rounded-xl bg-white"
                  />
                  <FieldError>{errors.name}</FieldError>
                </Field>

                <Field data-invalid={errors.phone ? 'true' : undefined}>
                  <FieldLabel
                    htmlFor="phone"
                    className="text-xs tracking-widest text-gray-700 uppercase"
                  >
                    Nomor Telepon
                  </FieldLabel>
                  <PhoneInput
                    id="phone"
                    name="phone"
                    required
                    aria-invalid={!!errors.phone}
                    className="h-11 rounded-xl bg-white"
                  />
                  <FieldError>{errors.phone}</FieldError>
                </Field>
              </Card>

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

              <Card className="rounded-2xl border border-gray-200 bg-gray-50 p-5">
                <Field>
                  <FieldLabel className="text-xs tracking-widest text-gray-700 uppercase">
                    Catatan
                  </FieldLabel>
                  <Textarea name="note" className="rounded-xl bg-white" />
                </Field>

                <Field data-invalid={errors.paymentMethod ? 'true' : undefined}>
                  <FieldLabel className="text-xs tracking-widest text-gray-700 uppercase">
                    Metode Pembayaran
                  </FieldLabel>
                  <select
                    name="paymentMethod"
                    required
                    defaultValue=""
                    className="h-11 w-full rounded-xl border border-gray-300 bg-white px-3 text-sm focus-visible:border-black focus-visible:outline-none"
                  >
                    <option value="" disabled>
                      Pilih metode pembayaran
                    </option>
                    {paymentMethods.map((method) => (
                      <option key={method.value} value={method.value}>
                        {method.label}
                      </option>
                    ))}
                  </select>
                  <FieldError>{errors.paymentMethod}</FieldError>
                </Field>
              </Card>

              <Button
                type="submit"
                disabled={processing}
                className="h-12 w-full rounded-xl bg-black text-base font-semibold tracking-wide text-white hover:bg-black/90 active:scale-95"
              >
                Buat Pesanan
              </Button>
            </>
          )}
        </Form>
      </div>
    </StaffLayout>
  )
}
