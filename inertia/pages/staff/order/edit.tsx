import StaffLayout from '@/components/layouts/staff_layout'
import {
  Notice,
  OutlineButton,
  Panel,
  SectionLabel,
  SolidButton,
} from '@/components/atoms/editorial'
import { TaskHeader } from '@/components/molecules/staff_task'
import { ItemCard, useItemRows, type ItemRow } from '@/components/organisms/item_fields'
import type { Data } from '@/generated/data'
import type { InertiaProps } from '@/types'
import { Form, Link } from '@adonisjs/inertia/react'
import { ActionName } from '@/enums/order_action_enum'
import { CatalogueCategory } from '@/enums/catalogue_enum'

type PageProps = InertiaProps<{
  order: Data.Order.Variants['toDetail']
  catalogues: Data.Catalogue[]
  canEdit: boolean
  isCounterOrder: boolean
}>

type OrderLine = NonNullable<Data.Order.Variants['toDetail']['items']>[number]

function toItemRows(items: OrderLine[], catalogues: Data.Catalogue[]): ItemRow[] {
  const categoryById = new Map(catalogues.map((catalogue) => [catalogue.id, catalogue.category]))

  return items.map((item, index) => {
    const row: ItemRow = {
      key: index,
      catalogueId: '',
      defaults: {
        brand: item.brand,
        model: item.model,
        material: item.material ?? '',
        size: item.size,
        condition: item.condition,
        note: item.note ?? '',
        additionalCatalogueIds: [],
      },
    }

    for (const booked of item.catalogues ?? []) {
      if (categoryById.get(booked.catalogueId) === CatalogueCategory.ADDITIONAL) {
        row.defaults!.additionalCatalogueIds.push(booked.catalogueId)
      } else {
        row.catalogueId = String(booked.catalogueId)
      }
    }

    return row
  })
}

export default function Edit({ order, catalogues, canEdit, isCounterOrder }: PageProps) {
  const { items, addItem, removeItem, setCatalogueId } = useItemRows(
    toItemRows(order.items ?? [], catalogues)
  )

  const inspectionPhoto = order.actions?.find(
    (action) => action.name === ActionName.INSPECTION
  )?.photoPath

  return (
    <StaffLayout
      title={`Ubah Barang - ${order.orderNumber}`}
      description="Perbaiki data barang sebelum pelanggan melunasi"
    >
      <TaskHeader eyebrow="Ubah Barang" title={order.orderNumber} showBack />

      <div className="gutter flex flex-1 flex-col gap-3 pb-nav">
        <Panel tone="tint" className="px-5 py-4">
          <p className="m-0 text-small leading-[1.6] text-ink-body">
            {canEdit
              ? 'Perbaiki merek, model, atau layanan yang salah sebelum pelanggan melunasi. Setelah dilunasi, data barang tidak dapat diubah lagi.'
              : 'Data barang hanya dapat diperbaiki selagi pesanan menunggu pelunasan.'}
          </p>
          <div className="mt-3 flex items-center justify-between gap-3 border-t border-rule pt-3 text-small leading-normal">
            <span className="text-ink-soft">Total saat ini</span>
            <span className="font-semibold text-ink">{order.totalPriceLabel}</span>
          </div>
        </Panel>

        {!canEdit && (
          <Notice>
            {isCounterOrder ? (
              <span>
                <strong className="font-semibold text-ink">Tidak berlaku</strong> — pesanan ini
                sudah dibayar di kasir saat dibuat, jadi tidak ada tagihan yang bisa diperbaiki.
              </span>
            ) : (
              <span>
                Perbaikan barang hanya tersedia sebelum pelanggan membayar, yaitu untuk pesanan
                online yang sudah diinspeksi tetapi belum dilunasi. Pesanan ini berstatus{' '}
                <strong className="font-semibold text-ink">{order.statusLabel}</strong>.
              </span>
            )}
          </Notice>
        )}

        {inspectionPhoto && (
          <Panel tone="tint">
            <div className="border-b border-rule px-5 py-3.5">
              <SectionLabel>Foto Inspeksi</SectionLabel>
            </div>
            <div className="px-5 py-4">
              <img
                src={inspectionPhoto}
                alt="Foto inspeksi"
                className="aspect-video w-full border border-rule object-cover"
              />
            </div>
          </Panel>
        )}

        {canEdit && (
          <Form
            route="staff.order.update"
            routeParams={{ number: order.orderNumber }}
            className="flex flex-col gap-3"
          >
            {({ processing }) => (
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

                <SolidButton type="submit" disabled={processing}>
                  Simpan Barang
                </SolidButton>
              </>
            )}
          </Form>
        )}

        <Link route="staff.trip.index" className="block">
          <OutlineButton render={<span />}>
            {canEdit ? 'Sudah Benar' : 'Kembali ke Tugas'}
          </OutlineButton>
        </Link>
      </div>
    </StaffLayout>
  )
}
