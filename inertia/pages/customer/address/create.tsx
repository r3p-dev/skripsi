import { PhoneInput } from '@/components/atoms/phone_input'
import CustomerLayout from '@/components/layouts/customer_layout'
import PinpointMap from '@/components/organisms/pinpoint_map'
import { Button } from '@/components/ui/button'
import { Field, FieldError, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import type { Data } from '@/generated/data'
import type { InertiaProps } from '@/types'
import { Form, Link } from '@adonisjs/inertia/react'
import { IconArrowLeft, IconChevronRight } from '@tabler/icons-react'
import { latLng } from 'leaflet'
import { useState } from 'react'

type PageProps = InertiaProps<{
  address: Data.Address | null
}>

export default function Create({ address }: PageProps) {
  const [position, setPosition] = useState(
    address ? latLng(address.latitude, address.longitude) : latLng(-6.2088, 106.8456)
  )

  return (
    <CustomerLayout
      title={address ? 'Ubah Alamat' : 'Tambah Alamat'}
      description={
        address
          ? 'Perbarui alamat penjemputan UmimaClean Anda'
          : 'Tambahkan alamat penjemputan UmimaClean Anda'
      }
    >
      <div className="flex items-center gap-3 px-6 py-5">
        <Link
          route="customer.address.show"
          className="flex size-11 shrink-0 items-center justify-center rounded-full border border-gray-300 text-black transition-colors hover:bg-gray-100 active:scale-95"
        >
          <IconArrowLeft className="size-5" />
        </Link>
        <div>
          <p className="text-xs tracking-[0.3em] text-gray-600 uppercase font-medium">Alamat</p>
          <h1 className="text-2xl font-bold tracking-tight text-black">
            {address ? 'Ubah Alamat' : 'Tambah Alamat'}
          </h1>
        </div>
      </div>

      <div className="flex-1 px-6 pb-nav">
        <p className="mb-6 text-sm leading-relaxed text-gray-700">
          Masukkan detail Anda di bawah ini untuk {address ? 'memperbarui' : 'menambahkan'} alamat
          penjemputan
        </p>

        <Form route="customer.address.store" className="space-y-5">
          {({ errors, processing }) => (
            <>
              <Field data-invalid={errors.name ? 'true' : undefined}>
                <FieldLabel
                  htmlFor="name"
                  className="text-xs tracking-widest text-gray-700 uppercase"
                >
                  Nama Lengkap
                </FieldLabel>
                <Input
                  id="name"
                  name="name"
                  type="text"
                  autoComplete="name"
                  defaultValue={address?.name}
                  aria-invalid={!!errors.name}
                  className="h-12 rounded-xl border-gray-300 bg-gray-50 px-4 focus-visible:border-black focus-visible:ring-black/10"
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
                  autoComplete="tel"
                  defaultValue={address?.phone}
                  aria-invalid={!!errors.phone}
                  className="h-12 rounded-xl border-gray-300 bg-gray-50 px-4 focus-visible:border-black focus-visible:ring-black/10"
                />
                <FieldError>{errors.phone}</FieldError>
              </Field>

              <Field data-invalid={errors.street ? 'true' : undefined}>
                <FieldLabel
                  htmlFor="street"
                  className="text-xs tracking-widest text-gray-700 uppercase"
                >
                  Alamat
                </FieldLabel>
                <Textarea
                  id="street"
                  name="street"
                  autoComplete="street-address"
                  defaultValue={address?.street}
                  aria-invalid={!!errors.street}
                  className="min-h-24 rounded-xl border-gray-300 bg-gray-50 px-4 py-3 focus-visible:border-black focus-visible:ring-black/10"
                />
                <FieldError>{errors.street}</FieldError>
              </Field>

              <Field data-invalid={errors.radius ? 'true' : undefined}>
                <FieldLabel className="text-xs tracking-widest text-gray-700 uppercase">
                  Titik Lokasi
                </FieldLabel>
                <div className="overflow-hidden rounded-xl border border-gray-300">
                  <PinpointMap
                    value={position}
                    onChange={setPosition}
                    disableAutoLocation={!!address}
                  />
                </div>
                <FieldError>{errors.radius}</FieldError>
              </Field>

              <Field data-invalid={errors.note ? 'true' : undefined}>
                <FieldLabel
                  htmlFor="note"
                  className="text-xs tracking-widest text-gray-700 uppercase"
                >
                  Catatan Tambahan
                </FieldLabel>
                <Textarea
                  id="note"
                  name="note"
                  defaultValue={address?.note ?? undefined}
                  placeholder="Contoh: rumah pagar hitam, sebelah minimarket"
                  aria-invalid={!!errors.note}
                  className="min-h-20 rounded-xl border-gray-300 bg-gray-50 px-4 py-3 focus-visible:border-black focus-visible:ring-black/10"
                />
                <FieldError>{errors.note}</FieldError>
              </Field>

              {errors.form && <p className="text-sm text-destructive">{errors.form}</p>}

              <Button
                type="submit"
                disabled={processing}
                className="h-12 w-full rounded-xl bg-black text-lg font-semibold tracking-wide text-white transition-all duration-300 hover:bg-black/90 active:scale-95"
              >
                Simpan
                <IconChevronRight className="size-5" />
              </Button>
            </>
          )}
        </Form>
      </div>
    </CustomerLayout>
  )
}
