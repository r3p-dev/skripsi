import { PhoneInput } from '@/components/atoms/phone_input'
import StaffLayout from '@/components/layouts/staff_layout'
import {
  BoxInput,
  BoxSelect,
  BoxTextarea,
  OutlineButton,
  Panel,
  SectionLabel,
  SolidButton,
  boxField,
} from '@/components/atoms/editorial'
import { TaskHeader } from '@/components/molecules/staff_task'
import { Field, FieldError, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { ItemCard, useItemRows } from '@/components/organisms/item_fields'
import { CustomerLookup, type FoundCustomer } from '@/components/organisms/customer_lookup'
import { cn } from '@/lib/utils'
import type { Data } from '@/generated/data'
import type { InertiaProps } from '@/types'
import { PaymentMethod, PaymentMethodLabel } from '@/enums/transaction_enum'
import { CatalogueCategory } from '@/enums/catalogue_enum'
import { formatRupiah } from '@/lib/format'
import { Form } from '@adonisjs/inertia/react'
import { IconInfoCircle } from '@tabler/icons-react'
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

  const runningTotal = items.reduce((total, row) => {
    const service = services.find((candidate) => String(candidate.id) === row.serviceId)

    return total + (service?.price ?? 0)
  }, 0)

  const isCash = paymentMethod === PaymentMethod.CASH
  const received = Number(cashReceived)
  const change = isCash && received > 0 ? received - runningTotal : null

  return (
    <StaffLayout title="Pesanan Offline" description="Buat pesanan offline di tempat">
      <TaskHeader eyebrow="Pesanan Offline" title="Pesanan Baru" showBack />

      <div className="gutter flex flex-1 flex-col pb-nav">
        <Form route="staff.order.store" className="flex flex-col gap-3">
          {({ errors, processing }) => (
            <>
              <input type="hidden" name="totalItems" value={items.length} />

              <Panel tone="tint">
                <div className="border-b border-rule px-5 py-3.5">
                  <SectionLabel>Pelanggan</SectionLabel>
                </div>

                <div className="flex flex-col gap-5 px-5 py-4">
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
                    <FieldLabel htmlFor="name" className="field-label mb-2">
                      Nama Pelanggan
                    </FieldLabel>
                    <BoxInput
                      id="name"
                      name="name"
                      key={customer?.id ?? 'manual'}
                      defaultValue={customer?.name ?? ''}
                      required
                      aria-invalid={!!errors.name}
                    />
                    <FieldError>{errors.name}</FieldError>
                  </Field>

                  <Field data-invalid={errors.phone ? 'true' : undefined}>
                    <FieldLabel htmlFor="phone" className="field-label mb-2">
                      Nomor Telepon
                    </FieldLabel>
                    <PhoneInput
                      id="phone"
                      name="phone"
                      key={customer?.id ?? 'manual-phone'}
                      defaultValue={customer?.phone ?? ''}
                      required
                      aria-invalid={!!errors.phone}
                      className={boxField}
                    />
                    <FieldError>{errors.phone}</FieldError>
                  </Field>

                  <Field data-invalid={errors.delivery ? 'true' : undefined}>
                    <label className="flex min-h-11 items-start gap-3 py-1 text-small leading-normal text-ink-body">
                      <input
                        type="checkbox"
                        name="delivery"
                        value="true"
                        checked={delivery}
                        disabled={!customer}
                        onChange={(event) => setDelivery(event.target.checked)}
                        className="mt-0.5 size-4.5 shrink-0 rounded-xs border-rule-field accent-ink disabled:opacity-40"
                      />
                      <span>
                        Antar kembali ke alamat pelanggan
                        {!customer && (
                          <span className="mt-0.5 block text-meta text-ink-subtle">
                            Pilih akun pelanggan terlebih dahulu — pengantaran memerlukan alamat
                            yang tersimpan di akun.
                          </span>
                        )}
                      </span>
                    </label>
                    <FieldError>{errors.delivery}</FieldError>
                  </Field>
                </div>
              </Panel>

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

              <OutlineButton type="button" onClick={addItem} className="py-3 text-meta">
                Tambah Barang
              </OutlineButton>

              <Panel tone="tint" className="flex flex-col gap-5 px-5 py-5">
                <Field data-invalid={errors.photo ? 'true' : undefined}>
                  <FieldLabel htmlFor="photo" className="field-label mb-2">
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
                    className={cn(boxField, 'h-12 py-2.5')}
                  />
                  <FieldError>{errors.photo}</FieldError>
                </Field>

                <Field>
                  <FieldLabel htmlFor="note" className="field-label mb-2">
                    Catatan
                  </FieldLabel>
                  <BoxTextarea id="note" name="note" />
                </Field>

                <Field data-invalid={errors.paymentMethod ? 'true' : undefined}>
                  <FieldLabel htmlFor="paymentMethod" className="field-label mb-2">
                    Metode Pembayaran
                  </FieldLabel>
                  <BoxSelect
                    id="paymentMethod"
                    name="paymentMethod"
                    required
                    value={paymentMethod}
                    onChange={(event) => setPaymentMethod(event.target.value)}
                  >
                    <option value="" disabled>
                      Pilih metode pembayaran
                    </option>
                    {paymentMethods.map((method) => (
                      <option key={method.value} value={method.value}>
                        {method.label}
                      </option>
                    ))}
                  </BoxSelect>
                  <FieldError>{errors.paymentMethod}</FieldError>
                </Field>

                {isCash && (
                  <Field data-invalid={errors.cashReceived ? 'true' : undefined}>
                    <FieldLabel htmlFor="cashReceived" className="field-label mb-2">
                      Uang Diterima
                    </FieldLabel>
                    <BoxInput
                      id="cashReceived"
                      name="cashReceived"
                      type="number"
                      min={0}
                      step={1000}
                      required
                      value={cashReceived}
                      onChange={(event) => setCashReceived(event.target.value)}
                      aria-invalid={!!errors.cashReceived}
                    />
                    <FieldError>{errors.cashReceived}</FieldError>

                    <div className="mt-2.5 border border-rule-field bg-white px-4 py-3">
                      <div className="flex items-center justify-between gap-3 text-small leading-normal">
                        <span className="text-ink-soft">Perkiraan total</span>
                        <span className="font-semibold text-ink">{formatRupiah(runningTotal)}</span>
                      </div>
                      <div className="mt-1.5 flex items-center justify-between gap-3 border-t border-rule pt-1.5 text-small leading-normal">
                        <span className="text-ink-soft">Kembalian</span>
                        <span
                          className={
                            change !== null && change < 0
                              ? 'font-bold text-destructive'
                              : 'font-bold text-ink'
                          }
                        >
                          {change === null ? '-' : formatRupiah(change)}
                        </span>
                      </div>
                      {change !== null && change < 0 && (
                        <p className="m-0 mt-2 flex items-start gap-1.5 text-meta leading-normal text-destructive">
                          <IconInfoCircle className="mt-0.5 size-3.5 shrink-0" />
                          Uang yang diterima masih kurang dari total pesanan.
                        </p>
                      )}
                      {services.some(
                        (service) => service.category === CatalogueCategory.ADDITIONAL
                      ) && (
                        <p className="m-0 mt-2 text-meta leading-normal text-ink-subtle">
                          Belum termasuk layanan tambahan — total akhir ada di struk.
                        </p>
                      )}
                    </div>
                  </Field>
                )}
              </Panel>

              <SolidButton type="submit" disabled={processing}>
                Buat Pesanan
              </SolidButton>
            </>
          )}
        </Form>
      </div>
    </StaffLayout>
  )
}
