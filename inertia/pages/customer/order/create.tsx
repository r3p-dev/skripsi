import {
  BackLink,
  Eyebrow,
  Lede,
  PageTitle,
  SolidButton,
  StickyBar,
  UnderlineInput,
} from '@/components/atoms/editorial'
import CustomerLayout from '@/components/layouts/customer_layout'
import { Calendar } from '@/components/ui/calendar'
import { Field, FieldError, FieldLabel } from '@/components/ui/field'
import { ItemType, ItemTypeLabel } from '@/enums/item_enum'
import type { Data } from '@/generated/data'
import type { InertiaProps } from '@/types'
import { Form, Link } from '@adonisjs/inertia/react'
import { id } from 'date-fns/locale'
import { useMemo, useState } from 'react'

type PageProps = InertiaProps<{
  address: Data.Address | null
}>

const ITEM_TYPES = [ItemType.SHOE, ItemType.BAG, ItemType.HELMET] as const

const SIZE_PLACEHOLDER: Record<string, string> = {
  [ItemType.SHOE]: 'cth: 42',
  [ItemType.BAG]: 'cth: Medium',
  [ItemType.HELMET]: 'cth: L',
}

type Quantities = Record<string, number>

const summaryLabel = 'mb-1.5 text-eyebrow leading-[1.4] tracking-[0.1em] text-ink-subtle uppercase'

function toLocalDateString(date: Date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')

  return `${year}-${month}-${day}`
}

function Stepper({
  label,
  value,
  onChange,
}: {
  label: string
  value: number
  onChange: (next: number) => void
}) {
  return (
    <div className="flex items-center justify-between border-b border-rule py-3.5 last:border-b-0">
      <span className="text-lead leading-[1.4] text-ink">{label}</span>
      <div role="group" aria-label={`Jumlah ${label}`} className="flex items-center gap-4">
        <button
          type="button"
          onClick={() => onChange(Math.max(0, value - 1))}
          aria-label={`Kurangi jumlah ${label}`}
          className="flex size-8 items-center justify-center rounded-full border border-rule-field text-ink disabled:opacity-40"
          disabled={value === 0}
        >
          −
        </button>
        <span aria-live="polite" className="min-w-4 text-center text-lead font-semibold text-ink">
          {value}
        </span>
        <button
          type="button"
          onClick={() => onChange(value + 1)}
          aria-label={`Tambah jumlah ${label}`}
          className="flex size-8 items-center justify-center rounded-full border border-rule-field text-ink"
        >
          +
        </button>
      </div>
    </div>
  )
}

export default function Create({ address }: PageProps) {
  const [quantities, setQuantities] = useState<Quantities>({})
  const [pickupDate, setPickupDate] = useState<Date | undefined>(undefined)

  const earliestPickup = useMemo(() => {
    const tomorrow = new Date()
    tomorrow.setHours(0, 0, 0, 0)
    tomorrow.setDate(tomorrow.getDate() + 1)

    return tomorrow
  }, [])

  const slots = useMemo(
    () =>
      ITEM_TYPES.flatMap((type) =>
        Array.from({ length: quantities[type] ?? 0 }, (_, index) => ({
          key: `${type}-${index}`,
          type,
          title: `${ItemTypeLabel[type]} #${index + 1}`,
        }))
      ),
    [quantities]
  )

  if (!address) {
    return (
      <CustomerLayout title="Pesan Layanan" description="Atur penjemputan barang Anda">
        <header className="gutter pt-6">
          <BackLink route="home">← Kembali</BackLink>
        </header>
        <div className="gutter flex-1 py-16 text-center pb-nav desktop:pb-page">
          <div className="mb-5 text-body leading-[1.6] text-ink-subtle">
            Tambahkan alamat penjemputan terlebih dahulu sebelum membuat pesanan.
          </div>
          <Link route="customer.address.create" className="block">
            <SolidButton render={<span />}>Tambah Alamat</SolidButton>
          </Link>
        </div>
      </CustomerLayout>
    )
  }

  const pickupDateLabel = pickupDate
    ? pickupDate.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })
    : 'Belum dipilih'

  return (
    <CustomerLayout title="Pesan Layanan" description="Atur penjemputan barang Anda" wide>
      <header className="gutter pt-6">
        <BackLink route="home">← Kembali</BackLink>
      </header>

      <div className="flex-1 pb-nav desktop:pb-page">
        <div className="gutter pt-7 pb-2">
          <PageTitle className="mb-1.5">Pesan Layanan</PageTitle>
          <Lede>Atur penjemputan barang Anda.</Lede>
        </div>

        <Form action="/orders" method="post" id="order-form">
          {({ errors, processing }) => (
            <>
              <div className="gutter desktop:grid desktop:grid-cols-[1fr_380px] desktop:items-start desktop:gap-x-14">
                <div>
                  <section className="pt-6">
                    <Eyebrow className="mb-4">Jumlah &amp; Jenis Barang</Eyebrow>
                    {ITEM_TYPES.map((type) => (
                      <Stepper
                        key={type}
                        label={ItemTypeLabel[type]}
                        value={quantities[type] ?? 0}
                        onChange={(next) => setQuantities((prev) => ({ ...prev, [type]: next }))}
                      />
                    ))}
                  </section>

                  <section className="pt-8">
                    <Eyebrow className="mb-4">Detail Barang</Eyebrow>

                    {slots.length === 0 ? (
                      <div className="text-small leading-[1.6] text-ink-subtle">
                        Pilih jumlah barang di atas untuk menambahkan detail.
                      </div>
                    ) : (
                      slots.map((slot, index) => (
                        <div key={slot.key} className="mb-4 border border-rule-strong p-5">
                          <div className="mb-4 text-small leading-[1.4] font-semibold tracking-[0.06em] text-ink uppercase">
                            {slot.title}
                          </div>

                          <input type="hidden" name={`items[${index}][type]`} value={slot.type} />

                          <Field className="mb-3.5">
                            <FieldLabel htmlFor={`${slot.key}-brand`} className="field-label mb-2">
                              Merk
                            </FieldLabel>
                            <UnderlineInput
                              id={`${slot.key}-brand`}
                              name={`items[${index}][brand]`}
                              placeholder="cth: Nike"
                              className="py-2 text-sm"
                            />
                          </Field>

                          <Field className="mb-3.5">
                            <FieldLabel htmlFor={`${slot.key}-model`} className="field-label mb-2">
                              Model
                            </FieldLabel>
                            <UnderlineInput
                              id={`${slot.key}-model`}
                              name={`items[${index}][model]`}
                              placeholder="cth: Air Force 1"
                              className="py-2 text-sm"
                            />
                          </Field>

                          <div className="flex gap-4">
                            <Field className="flex-1">
                              <FieldLabel
                                htmlFor={`${slot.key}-material`}
                                className="field-label mb-2"
                              >
                                Bahan
                              </FieldLabel>
                              <UnderlineInput
                                id={`${slot.key}-material`}
                                name={`items[${index}][material]`}
                                placeholder="cth: Kulit"
                                className="py-2 text-sm"
                              />
                            </Field>
                            <Field className="flex-1">
                              <FieldLabel htmlFor={`${slot.key}-size`} className="field-label mb-2">
                                Ukuran
                              </FieldLabel>
                              <UnderlineInput
                                id={`${slot.key}-size`}
                                name={`items[${index}][size]`}
                                placeholder={SIZE_PLACEHOLDER[slot.type]}
                                className="py-2 text-sm"
                              />
                            </Field>
                          </div>
                        </div>
                      ))
                    )}
                  </section>

                  <section className="pt-8">
                    <Eyebrow className="mb-4">Tanggal Penjemputan</Eyebrow>
                    <div className="border border-rule-strong p-5 tablet:mx-auto tablet:max-w-115 desktop:mx-0 desktop:max-w-none">
                      <Calendar
                        mode="single"
                        locale={id}
                        selected={pickupDate}
                        onSelect={setPickupDate}
                        disabled={{ before: earliestPickup }}
                        className="w-full p-0"
                      />
                    </div>
                    <input
                      type="hidden"
                      name="pickupDate"
                      value={pickupDate ? toLocalDateString(pickupDate) : ''}
                    />
                    <div className="mt-3.5 text-small leading-[1.6] text-ink-soft">
                      Tanggal dipilih:{' '}
                      <span className="font-semibold text-ink">{pickupDateLabel}</span>
                    </div>
                    <FieldError>{errors.pickupDate}</FieldError>
                  </section>

                  <section className="pt-8 desktop:hidden">
                    <Eyebrow className="mb-4">Alamat Penjemputan</Eyebrow>
                    <div className="flex items-center justify-between gap-3 border border-rule-strong px-5 py-4.5">
                      <div>
                        <div className="mb-1 text-body leading-[1.4] font-semibold text-ink">
                          {address.name}
                        </div>
                        <div className="text-small leading-normal text-ink-soft">
                          {address.street}
                        </div>
                      </div>
                      <Link
                        route="customer.address.create"
                        className="ml-3 text-meta whitespace-nowrap text-ink-soft hover:text-ink"
                      >
                        Ubah
                      </Link>
                    </div>
                  </section>

                  {errors.form && <p className="pt-4 text-small text-destructive">{errors.form}</p>}
                </div>

                <aside className="hidden desktop:block desktop:pt-6">
                  <div className="sticky top-6 border border-rule-strong p-7">
                    <Eyebrow className="mb-5">Ringkasan Pesanan</Eyebrow>

                    <div className="mb-5 flex flex-col gap-2 border-b border-rule pb-5">
                      {ITEM_TYPES.map((type) => (
                        <div
                          key={type}
                          className="flex justify-between text-small leading-normal text-ink-body"
                        >
                          <span>{ItemTypeLabel[type]}</span>
                          <span>{quantities[type] ?? 0}</span>
                        </div>
                      ))}
                    </div>

                    <div className="mb-5 border-b border-rule pb-5">
                      <div className={summaryLabel}>Tanggal Penjemputan</div>
                      <div className="text-body leading-[1.4] font-semibold text-ink">
                        {pickupDateLabel}
                      </div>
                    </div>

                    <div className="mb-6">
                      <div className={summaryLabel}>Alamat Penjemputan</div>
                      <div className="mb-0.5 text-body leading-[1.4] font-semibold text-ink">
                        {address.name}
                      </div>
                      <div className="mb-1.5 text-small leading-normal text-ink-soft">
                        {address.street}
                      </div>
                      <Link
                        route="customer.address.create"
                        className="text-meta text-ink-soft hover:text-ink"
                      >
                        Ubah alamat
                      </Link>
                    </div>

                    <SolidButton
                      type="submit"
                      disabled={processing || slots.length === 0 || !pickupDate}
                    >
                      Konfirmasi Pesanan
                    </SolidButton>
                  </div>
                </aside>
              </div>

              <StickyBar className="tablet:max-w-180 desktop:hidden">
                <SolidButton
                  type="submit"
                  disabled={processing || slots.length === 0 || !pickupDate}
                >
                  Konfirmasi Pesanan
                </SolidButton>
              </StickyBar>
            </>
          )}
        </Form>
      </div>
    </CustomerLayout>
  )
}
