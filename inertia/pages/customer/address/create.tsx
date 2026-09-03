import { PhoneInput } from '@/components/atoms/phone_input'
import {
  BackLink,
  Lede,
  PageTitle,
  SolidButton,
  UnderlineInput,
  UnderlineTextarea,
  underlineField,
} from '@/components/atoms/editorial'
import CustomerLayout from '@/components/layouts/customer_layout'
import PinpointMap from '@/components/organisms/pinpoint_map'
import { Field, FieldError, FieldLabel } from '@/components/ui/field'
import type { Data } from '@/generated/data'
import type { InertiaProps } from '@/types'
import ConfirmLocation from '@/components/molecules/confirm_location'
import AddressSuggestions, {
  toNearbySuggestion,
  toSuggestion,
  type SuggestionItem,
} from '@/components/molecules/address_suggestions'
import { Form, Link } from '@adonisjs/inertia/react'
import { latLng } from 'leaflet'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { isWithinOperationalAreas, toCenter, type OperationalArea } from '@/lib/geo'
import {
  geocode,
  nearby,
  GEOCODE_MESSAGES,
  type GeocodeReason,
  type NearbyPlace,
} from '@/lib/geocode'

type PageProps = InertiaProps<{
  address: Data.Address | null
  operationalAreas: OperationalArea[]
}>

const OUTSIDE_AREA_MESSAGE = 'Lokasi tersebut berada di luar jangkauan layanan jemput-antar kami.'
const GEOCODE_DEBOUNCE = 800
const GEOCODE_MIN_LENGTH = 5
const NEARBY_DEBOUNCE = 1000
const FORM_ID = 'address-form'

export default function Create({ address, operationalAreas }: PageProps) {
  const [position, setPosition] = useState(() => {
    if (address) {
      return latLng(address.latitude, address.longitude)
    }

    const center = toCenter(operationalAreas)

    return center ? latLng(center[1], center[0]) : latLng(-6.9555305, 107.6540353)
  })

  const [street, setStreet] = useState(address?.street ?? '')
  const [isLocating, setIsLocating] = useState(false)
  const [isConfirming, setIsConfirming] = useState(false)
  const [geocodeReason, setGeocodeReason] = useState<GeocodeReason | null>(null)
  const [geocodeLabel, setGeocodeLabel] = useState<string | null>(null)
  const [typed, setTyped] = useState<SuggestionItem[]>([])
  const [nearbyPlaces, setNearbyPlaces] = useState<NearbyPlace[]>([])
  const [isListOpen, setIsListOpen] = useState(false)
  const [activeIndex, setActiveIndex] = useState(0)
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
        const { results, reason } = await geocode(query, controller.signal)

        lastGeocoded.current = query
        setGeocodeReason(reason)
        setTyped(results.map(toSuggestion))
        setActiveIndex(0)
        setIsListOpen(results.length > 0)
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

  useEffect(() => {
    const controller = new AbortController()
    const timer = window.setTimeout(async () => {
      try {
        setNearbyPlaces(await nearby(position.lat, position.lng, controller.signal))
      } catch {
        setNearbyPlaces([])
      }
    }, NEARBY_DEBOUNCE)

    return () => {
      window.clearTimeout(timer)
      controller.abort()
    }
  }, [position])

  const hasTyped = street.trim().length >= GEOCODE_MIN_LENGTH
  const items = hasTyped ? typed : nearbyPlaces.map(toNearbySuggestion)
  const heading = hasTyped ? null : 'Lokasi terdekat'
  const visibleItems = isListOpen ? items : []

  const pickSuggestion = useCallback((item: SuggestionItem) => {
    setPosition(latLng(item.latitude, item.longitude))
    setStreet(item.label)
    lastGeocoded.current = item.label
    setGeocodeLabel(item.label)
    setGeocodeReason(null)
    setIsListOpen(false)
  }, [])

  const onStreetKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (visibleItems.length === 0) {
      return
    }

    if (event.key === 'ArrowDown') {
      event.preventDefault()
      setActiveIndex((index) => (index + 1) % visibleItems.length)
    } else if (event.key === 'ArrowUp') {
      event.preventDefault()
      setActiveIndex((index) => (index - 1 + visibleItems.length) % visibleItems.length)
    } else if (event.key === 'Enter') {
      event.preventDefault()
      pickSuggestion(visibleItems[activeIndex])
    } else if (event.key === 'Escape') {
      setIsListOpen(false)
    }
  }

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

      <div className="flex-1 gutter pb-nav desktop:pb-page">
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
                  className={underlineField}
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
                <div className="relative">
                  <UnderlineTextarea
                    id="street"
                    name="street"
                    rows={2}
                    placeholder="Nama jalan, nomor rumah"
                    autoComplete="off"
                    role="combobox"
                    aria-expanded={visibleItems.length > 0}
                    aria-controls="address-suggestions"
                    aria-autocomplete="list"
                    aria-activedescendant={
                      visibleItems.length > 0 ? `address-suggestion-${activeIndex}` : undefined
                    }
                    value={street}
                    onFocus={() => setIsListOpen(true)}
                    onChange={(event) => {
                      setStreet(event.target.value)
                      setGeocodeReason(null)
                      setGeocodeLabel(null)
                      setIsListOpen(true)
                    }}
                    onKeyDown={onStreetKeyDown}
                    aria-invalid={!!errors.street || !!geocodeMessage}
                  />
                  <AddressSuggestions
                    heading={heading}
                    items={visibleItems}
                    activeIndex={activeIndex}
                    onHighlight={setActiveIndex}
                    onPick={pickSuggestion}
                    onDismiss={() => setIsListOpen(false)}
                  />
                </div>
                {isLocating && <p className="text-meta text-ink-subtle">Mencari alamat...</p>}
                {!isLocating && visibleItems.length > 0 && (
                  <p className="text-meta text-ink-subtle">
                    {hasTyped
                      ? 'Pilih salah satu saran untuk menempatkan titik peta.'
                      : 'Atau pilih tempat terdekat dari titik peta saat ini.'}
                  </p>
                )}
                {!isLocating && geocodeLabel && (
                  <p className="text-meta leading-normal text-ink-soft">
                    Titik peta diarahkan ke <span className="text-ink">{geocodeLabel}</span>. Geser
                    peta jika belum tepat.
                  </p>
                )}
                <FieldError>{geocodeMessage ?? errors.street}</FieldError>
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

              <Field
                className="mb-5"
                data-invalid={errors.location || isOutsideArea ? 'true' : undefined}
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
                <FieldError>{isOutsideArea ? OUTSIDE_AREA_MESSAGE : errors.location}</FieldError>
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
      </div>
    </CustomerLayout>
  )
}
