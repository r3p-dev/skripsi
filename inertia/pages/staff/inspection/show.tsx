import StaffLayout from '@/components/layouts/staff_layout'
import { OutlineButton, boxField } from '@/components/atoms/editorial'
import {
  ClaimPrompt,
  TaskAddress,
  TaskHeader,
  TaskSummary,
} from '@/components/molecules/staff_task'
import { Field, FieldError, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { ItemCard, useItemRows } from '@/components/organisms/item_fields'
import { cn } from '@/lib/utils'
import type { Data } from '@/generated/data'
import type { InertiaProps } from '@/types'
import { ConfirmDialog, ConfirmFooter } from '@/components/molecules/confirm_action'
import { Form } from '@adonisjs/inertia/react'

type PageProps = InertiaProps<{
  order: Data.Order.Variants['toDetail']
  catalogues: Data.Catalogue[]
  claimed: boolean
}>

export default function Show({ order, catalogues, claimed }: PageProps) {
  const { items, addItem, removeItem, setCatalogueId } = useItemRows()

  return (
    <StaffLayout title={`Inspeksi - ${order.orderNumber}`} description="Detail tugas inspeksi">
      <TaskHeader eyebrow="Inspeksi" title={order.orderNumber} showBack={!claimed} />

      <div className="gutter flex flex-1 flex-col gap-3 pb-nav">
        <TaskSummary status={order.statusLabel} pickupDate={order.pickupDate ?? '—'} />

        {!claimed ? (
          <ClaimPrompt orderNumber={order.orderNumber}>
            <Form
              id="claim-inspection"
              route="staff.inspection.claim"
              routeParams={{ number: order.orderNumber }}
            >
              {({ processing }) => (
                <ConfirmDialog
                  triggerClassName="flex min-h-12 w-full items-center justify-center bg-ink px-4 text-small font-medium tracking-[0.08em] text-white uppercase transition-colors hover:bg-ink/90"
                  label="Mulai Kerjakan Tugas"
                  title="Ambil tugas inspeksi?"
                  description={`Pesanan ${order.orderNumber} akan menjadi tugas Anda selama 3 jam dan hilang dari antrean petugas lain.`}
                >
                  <ConfirmFooter
                    label="Ambil Tugas"
                    processing={processing}
                    formId="claim-inspection"
                  />
                </ConfirmDialog>
              )}
            </Form>
          </ClaimPrompt>
        ) : (
          <>
            {order.address && <TaskAddress address={order.address} />}

            <Form
              id="complete-inspection"
              route="staff.inspection.update"
              routeParams={{ number: order.orderNumber }}
              className="flex flex-col gap-3"
            >
              {({ errors, processing }) => (
                <>
                  {items.map((item, index) => (
                    <ItemCard
                      key={item.key}
                      index={index}
                      catalogues={catalogues}
                      item={item}
                      canRemove={items.length > 1}
                      onCatalogueChange={(catalogueId) => setCatalogueId(item.key, catalogueId)}
                      onRemove={() => removeItem(item.key)}
                    />
                  ))}

                  <OutlineButton type="button" onClick={addItem} className="py-3 text-meta">
                    Tambah Barang
                  </OutlineButton>

                  <Field data-invalid={errors.photo ? 'true' : undefined}>
                    <FieldLabel htmlFor="photo" className="field-label mb-2">
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
                      className={cn(boxField, 'h-12 py-2.5')}
                    />
                    <FieldError>{errors.photo}</FieldError>
                  </Field>

                  <ConfirmDialog
                    triggerClassName="flex min-h-12 w-full items-center justify-center bg-ink px-4 text-small font-medium tracking-[0.08em] text-white uppercase transition-colors hover:bg-ink/90"
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
              triggerClassName="flex min-h-12 w-full items-center justify-center border border-rule-field px-4 text-small font-medium tracking-[0.08em] text-ink uppercase transition-colors hover:bg-paper-tint"
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
