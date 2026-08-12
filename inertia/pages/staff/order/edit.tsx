import StaffLayout from '@/components/layouts/staff_layout'
import { OutlineButton, Panel, SectionLabel, SolidButton } from '@/components/atoms/editorial'
import { TaskHeader } from '@/components/molecules/staff_task'
import { ItemCard, useItemRows, type ItemRow } from '@/components/organisms/item_fields'
import type { Data } from '@/generated/data'
import type { InertiaProps } from '@/types'
import { Form, Link } from '@adonisjs/inertia/react'
import { ActionName } from '@/enums/order_action_enum'
import { CatalogueCategory } from '@/enums/catalogue_enum'

type PageProps = InertiaProps<{
  order: Data.Order.Variants['toDetail']
  services: Data.Service[]
}>

type OrderLine = NonNullable<Data.Order.Variants['toDetail']['items']>[number]

function toItemRows(orderItems: OrderLine[]): ItemRow[] {
  const rowsByItemId = new Map<number, ItemRow>()

  for (const orderItem of orderItems) {
    const item = orderItem.item
    const service = orderItem.service
    if (!item || !service) continue

    let row = rowsByItemId.get(item.id)

    if (!row) {
      row = {
        key: rowsByItemId.size,
        serviceId: '',
        defaults: {
          brand: item.brand,
          model: item.model,
          material: item.material ?? '',
          size: item.size,
          condition: item.condition,
          note: item.note ?? '',
          additionalServiceIds: [],
        },
      }
      rowsByItemId.set(item.id, row)
    }

    if (service.category === CatalogueCategory.ADDITIONAL) {
      row.defaults!.additionalServiceIds.push(service.id)
    } else {
      row.serviceId = String(service.id)
    }
  }

  return [...rowsByItemId.values()]
}

export default function Edit({ order, services }: PageProps) {
  const { items, addItem, removeItem, setServiceId } = useItemRows(toItemRows(order.items ?? []))

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
            Perbaiki merek, model, atau layanan yang salah sebelum pelanggan melunasi. Setelah
            dilunasi, data barang tidak dapat diubah lagi.
          </p>
          <div className="mt-3 flex items-center justify-between gap-3 border-t border-rule pt-3 text-small leading-normal">
            <span className="text-ink-soft">Total saat ini</span>
            <span className="font-semibold text-ink">{order.totalPrice ?? '-'}</span>
          </div>
        </Panel>

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

              <SolidButton type="submit" disabled={processing}>
                Simpan Barang
              </SolidButton>
            </>
          )}
        </Form>

        <Link route="staff.trip.index" className="block">
          <OutlineButton render={<span />}>Sudah Benar</OutlineButton>
        </Link>
      </div>
    </StaffLayout>
  )
}
