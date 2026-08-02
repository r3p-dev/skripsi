import { PhoneInput } from '@/components/atoms/phone_input'
import StaffLayout from '@/components/layouts/staff_layout'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Field, FieldError, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { ItemCard, useItemRows } from '@/components/organisms/item_fields'
import { CustomerLookup, type FoundCustomer } from '@/components/organisms/customer_lookup'
import type { Data } from '@/generated/data'
import type { InertiaProps } from '@/types'
import { PaymentMethod, PaymentMethodLabel } from '@/enums/transaction_enum'
import { ServiceCategory } from '@/enums/service_enum'
import { formatRupiah } from '@/lib/format'
import { Form, Link } from '@adonisjs/inertia/react'
import { IconArrowLeft, IconInfoCircle } from '@tabler/icons-react'
import { useState } from 'react'

type PageProps = InertiaProps<{
  services: Data.Service[]
}>

const paymentMethods = Object.values(PaymentMethod).map((method) => ({
  value: method,
  label: PaymentMethodLabel[method],
}))

export default function Create({ services }: PageProps) {
  const { items, addItem, removeItem, setServiceId } = useItemRows()
  const [customer, setCustomer] = useState<FoundCustomer | null>(null)
  const [delivery, setDelivery] = useState(false)
  const [paymentMethod, setPaymentMethod] = useState<string>('')
  const [cashReceived, setCashReceived] = useState('')

  /**
   * What the order will cost, worked out as staff pick services.
   *
   * Only the main service on each row counts here — the additional-service
   * checkboxes are uncontrolled, so the running total is a close estimate
   * rather than the final figure. It exists to make the change calculation
   * useful at the counter; the server prices the order for real.
   */
  const runningTotal = items.reduce((total, row) => {
    const service = services.find((candidate) => String(candidate.id) === row.serviceId)

    return total + (service?.price ?? 0)
  }, 0)

  const isCash = paymentMethod === PaymentMethod.CASH
  const received = Number(cashReceived)
  const change = isCash && received > 0 ? received - runningTotal : null

  return (
    <StaffLayout title="Pesanan Offline" description="Buat pesanan offline di tempat">
      <div className="flex items-center gap-3 px-6 py-5">
        <Link
          route="staff.trip.index"
          className="flex size-11 shrink-0 items-center justify-center rounded-full border border-gray-300 text-black transition-colors hover:bg-gray-100 active:scale-95"
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

      <div className="flex-1 space-y-4 px-6 pb-nav">
        <Form route="staff.order.store" className="space-y-4">
          {({ errors, processing }) => (
            <>
              {/*
                The form's own count, not `items.length` under another name.
                It says how many item forms this page is showing, which is what
                the page needs to render — the server counts what actually
                arrives.
              */}
              <input type="hidden" name="totalItems" value={items.length} />

              <Card className="rounded-2xl border border-gray-200 bg-gray-50 p-5">
                <p className="text-xs font-medium tracking-widest text-gray-600 uppercase">
                  Pelanggan
                </p>

                <CustomerLookup
                  selected={customer}
                  onSelect={setCustomer}
                  onClear={() => {
                    setCustomer(null)
                    setDelivery(false)
                  }}
                />

                {customer && <input type="hidden" name="customerId" value={customer.id} />}

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
                    key={customer?.id ?? 'manual'}
                    defaultValue={customer?.name ?? ''}
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
                    key={customer?.id ?? 'manual-phone'}
                    defaultValue={customer?.phone ?? ''}
                    required
                    aria-invalid={!!errors.phone}
                    className="h-11 rounded-xl bg-white"
                  />
                  <FieldError>{errors.phone}</FieldError>
                </Field>

                {/*
                  Delivery needs somewhere to deliver to, and the only address
                  the system trusts is one the customer pinned on a map
                  themselves. That lives on their account, so this is offered
                  only once an account has been picked.
                */}
                <Field data-invalid={errors.delivery ? 'true' : undefined}>
                  <label className="flex min-h-11 items-start gap-3 py-1 text-sm text-gray-700">
                    <input
                      type="checkbox"
                      name="delivery"
                      value="true"
                      checked={delivery}
                      disabled={!customer}
                      onChange={(event) => setDelivery(event.target.checked)}
                      className="mt-0.5 size-5 shrink-0 rounded border-gray-300 disabled:opacity-40"
                    />
                    <span>
                      Antar kembali ke alamat pelanggan
                      {!customer && (
                        <span className="block text-xs text-gray-500">
                          Pilih akun pelanggan terlebih dahulu — pengantaran memerlukan alamat yang
                          tersimpan di akun.
                        </span>
                      )}
                    </span>
                  </label>
                  <FieldError>{errors.delivery}</FieldError>
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
                {/*
                  A counter order never goes through inspection, so this is the
                  only record of what condition the shoes arrived in — which is
                  exactly the record any later disagreement turns on.
                */}
                <Field data-invalid={errors.photo ? 'true' : undefined}>
                  <FieldLabel
                    htmlFor="photo"
                    className="text-xs tracking-widest text-gray-700 uppercase"
                  >
                    Foto Kondisi Barang
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
                    value={paymentMethod}
                    onChange={(event) => setPaymentMethod(event.target.value)}
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

                {/*
                  The change, worked out as staff type, so nobody has to reach
                  for a calculator with a customer waiting. The estimate uses
                  the main service on each row; additional services are priced
                  by the server and appear on the receipt.
                */}
                {isCash && (
                  <Field data-invalid={errors.cashReceived ? 'true' : undefined}>
                    <FieldLabel
                      htmlFor="cashReceived"
                      className="text-xs tracking-widest text-gray-700 uppercase"
                    >
                      Uang Diterima
                    </FieldLabel>
                    <Input
                      id="cashReceived"
                      name="cashReceived"
                      type="number"
                      min={0}
                      step={1000}
                      required
                      value={cashReceived}
                      onChange={(event) => setCashReceived(event.target.value)}
                      aria-invalid={!!errors.cashReceived}
                      className="h-11 rounded-xl bg-white"
                    />
                    <FieldError>{errors.cashReceived}</FieldError>

                    <div className="space-y-1 rounded-xl border border-gray-300 bg-white p-3 text-sm">
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600">Perkiraan total</span>
                        <span className="font-semibold text-black">
                          {formatRupiah(runningTotal)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600">Kembalian</span>
                        <span
                          className={`font-bold ${
                            change !== null && change < 0 ? 'text-destructive' : 'text-black'
                          }`}
                        >
                          {change === null ? '-' : formatRupiah(change)}
                        </span>
                      </div>
                      {change !== null && change < 0 && (
                        <p className="flex items-start gap-1 text-xs text-destructive">
                          <IconInfoCircle className="mt-0.5 size-3 shrink-0" />
                          Uang yang diterima masih kurang dari total pesanan.
                        </p>
                      )}
                      {services.some(
                        (service) => service.category === ServiceCategory.ADDITIONAL
                      ) && (
                        <p className="text-xs text-gray-500">
                          Belum termasuk layanan tambahan — total akhir ada di struk.
                        </p>
                      )}
                    </div>
                  </Field>
                )}
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
