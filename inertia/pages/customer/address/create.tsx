import { PhoneInput } from '@/components/atoms/phone_input'
import {
  BackLink,
  Lede,
  PageTitle,
  SolidButton,
  UnderlineInput,
  UnderlineTextarea,
} from '@/components/atoms/editorial'
import CustomerLayout from '@/components/layouts/customer_layout'
import PinpointMap from '@/components/organisms/pinpoint_map'
import { Field, FieldError, FieldLabel } from '@/components/ui/field'
import type { Data } from '@/generated/data'
import type { InertiaProps } from '@/types'
import ConfirmLocation from '@/components/molecules/confirm_location'
import { Form, Link } from '@adonisjs/inertia/react'
import { latLng } from 'leaflet'
import { useEffect, useMemo, useRef, useState } from 'react'
import { isWithinOperationalAreas, toCenter, type OperationalArea } from '@/lib/geo'
import { geocode, GEOCODE_MESSAGES, type GeocodeReason } from '@/lib/geocode'

type PageProps = InertiaProps<{
  address: Data.Address | null
  operationalAreas: OperationalArea[]
}>

const OUTSIDE_AREA_MESSAGE = 'Lokasi tersebut berada di luar jangkauan layanan jemput-antar kami.'
const GEOCODE_DEBOUNCE = 800
const GEOCODE_MIN_LENGTH = 5
const FORM_ID = 'address-form'

export default function Create({ address, operationalAreas }: PageProps) {
  const [position, setPosition] = useState(() => {
    if (address) {
      return latLng(address.latitude, address.longitude)
    }

    const center = toCenter(operationalAreas)

    return center ? latLng(center[1], center[0]) : latLng(-6.2088, 106.8456)
  })

  const [street, setStreet] = useState(address?.street ?? '')
  const [isLocating, setIsLocating] = useState(false)
  const [isConfirming, setIsConfirming] = useState(false)
  const [geocodeReason, setGeocodeReason] = useState<GeocodeReason | null>(null)
  const [geocodeLabel, setGeocodeLabel] = useState<string | null>(null)
  const lastGeocoded = useRef(address?.street ?? '')

  const isOutsideArea = useMemo(
    () =>
      operationalAreas.length > 0 &&
      !isWithinOperationalAreas([position.lng, position.lat], operationalAreas),
    [position, operationalAreas]
  )

  const geocodeMessage = geocodeReason ? GEOCODE_MESSAGES[geocodeReason] : null
  const isAddressRejected = geocodeReason === 'not_found' || geocodeReason === 'outside_area'

  useEffect(() => {
    const query = street.trim()

    if (query.length < GEOCODE_MIN_LENGTH || query === lastGeocoded.current) {
      return
    }

    const controller = new AbortController()
    const timer = window.setTimeout(async () => {
      setIsLocating(true)

      try {
        const { result, reason } = await geocode(query, controller.signal)

        lastGeocoded.current = query
        setGeocodeReason(reason)
        setGeocodeLabel(result?.label ?? null)

        if (result) {
          setPosition(latLng(result.latitude, result.longitude))
        }
      } catch {
        lastGeocoded.current = ''
      } finally {
        if (!controller.signal.aborted) {
          setIsLocating(false)
        }
      }
    }, GEOCODE_DEBOUNCE)

    return () => {
      window.clearTimeout(timer)
      controller.abort()
    }
  }, [street])

  return (
    <CustomerLayout
      title={address ? 'Ubah Alamat' : 'Tambah Alamat'}
      description={
        address
          ? 'Perbarui alamat penjemputan UmimaClean Anda'
          : 'Tambahkan alamat penjemputan UmimaClean Anda'
      }
    >
      <header className="gutter pt-6">
        <BackLink route="customer.address.show">← Kembali</BackLink>
      </header>

      <main className="flex-1 gutter pb-nav">
        <div className="pt-7 pb-6">
          <PageTitle className="mb-1.5">{address ? 'Ubah Alamat' : 'Tambah Alamat'}</PageTitle>
          <Lede>Anda hanya dapat menyimpan satu alamat utama.</Lede>
        </div>

        <Form id={FORM_ID} route="customer.address.store">
          {({ errors, processing }) => (
            <>
              <Field className="mb-5" data-invalid={errors.name ? 'true' : undefined}>
                <FieldLabel htmlFor="name" className="field-label mb-2.5">
                  Nama Penerima
                </FieldLabel>
                <UnderlineInput
                  id="name"
                  name="name"
                  type="text"
                  autoComplete="name"
                  placeholder="Nama lengkap"
                  defaultValue={address?.name}
                  aria-invalid={!!errors.name}
                />
                <FieldError>{errors.name}</FieldError>
              </Field>

              <Field className="mb-5" data-invalid={errors.phone ? 'true' : undefined}>
                <FieldLabel htmlFor="phone" className="field-label mb-2.5">
                  Nomor Telepon
                </FieldLabel>
                <PhoneInput
                  id="phone"
                  name="phone"
                  autoComplete="tel"
                  placeholder="08xx-xxxx-xxxx"
                  defaultValue={address?.phone}
                  aria-invalid={!!errors.phone}
                  className="underline-field h-auto placeholder:text-ink-faint focus-visible:border-ink focus-visible:ring-0"
                />
                <FieldError>{errors.phone}</FieldError>
              </Field>

              <Field
                className="mb-5"
                data-invalid={errors.street || geocodeMessage ? 'true' : undefined}
              >
                <FieldLabel htmlFor="street" className="field-label mb-2.5">
                  Alamat Lengkap
                </FieldLabel>
                <UnderlineTextarea
                  id="street"
                  name="street"
                  rows={2}
                  placeholder="Nama jalan, nomor rumah"
                  autoComplete="street-address"
                  value={street}
                  onChange={(event) => {
                    setStreet(event.target.value)
                    setGeocodeReason(null)
                    setGeocodeLabel(null)
                  }}
                  aria-invalid={!!errors.street || !!geocodeMessage}
                />
                {isLocating && (
                  <p className="text-meta text-ink-subtle">Mencari lokasi alamat pada peta...</p>
                )}
                {!isLocating && geocodeLabel && (
                  <p className="text-meta leading-[1.5] text-ink-soft">
                    Titik peta diarahkan ke <span className="text-ink">{geocodeLabel}</span>. Geser
                    peta jika belum tepat.
                  </p>
                )}
                <FieldError>{geocodeMessage ?? errors.street}</FieldError>
              </Field>

              <Field
                className="mb-5"
                data-invalid={errors.radius || isOutsideArea ? 'true' : undefined}
              >
                <FieldLabel className="field-label mb-2.5">Titik Lokasi</FieldLabel>
                <div className="border border-rule">
                  <PinpointMap
                    value={position}
                    onChange={setPosition}
                    disableAutoLocation={!!address}
                    areas={operationalAreas}
                  />
                </div>
                <FieldError>{isOutsideArea ? OUTSIDE_AREA_MESSAGE : errors.radius}</FieldError>
              </Field>

              <Field className="mb-8" data-invalid={errors.note ? 'true' : undefined}>
                <FieldLabel htmlFor="note" className="field-label mb-2.5">
                  Catatan (opsional)
                </FieldLabel>
                <UnderlineTextarea
                  id="note"
                  name="note"
                  rows={2}
                  defaultValue={address?.note ?? undefined}
                  placeholder="Patokan lokasi"
                  aria-invalid={!!errors.note}
                />
                <FieldError>{errors.note}</FieldError>
              </Field>

              {errors.form && <p className="mb-4 text-small text-destructive">{errors.form}</p>}

              <SolidButton
                type="button"
                onClick={() => setIsConfirming(true)}
                disabled={processing || isOutsideArea || isLocating || isAddressRejected}
                className="mb-4"
              >
                Simpan Alamat
              </SolidButton>

              <Link
                route="customer.address.show"
                className="mb-10 block py-2 text-center text-small text-ink-subtle"
              >
                Batal
              </Link>

              <ConfirmLocation
                open={isConfirming}
                onOpenChange={setIsConfirming}
                latitude={position.lat}
                longitude={position.lng}
                street={street}
                matchedLabel={geocodeLabel}
                formId={FORM_ID}
                processing={processing}
              />
            </>
          )}
        </Form>
      </main>
    </CustomerLayout>
  )
}
