import StaffLayout from '@/components/layouts/staff_layout'
import { Button, buttonVariants } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { ItemCard, useItemRows, type ItemRow } from '@/components/organisms/item_fields'
import type { Data } from '@/generated/data'
import type { InertiaProps } from '@/types'
import { Form, Link } from '@adonisjs/inertia/react'
import { IconArrowLeft } from '@tabler/icons-react'

type PageProps = InertiaProps<{
  order: Data.Order
  items: Data.OrderItem[]
  services: Data.Service[]
}>

/**
 * Rebuilds the form rows from the priced lines on the order.
 *
 * An order has one line per item *and service*, so a pair of shoes with a main
 * wash plus a deodorizer arrives as two lines sharing the same item. They are
 * grouped back into one row per item, with the non-additional service as the
 * main one.
 */
function toItemRows(orderItems: Data.OrderItem[]): ItemRow[] {
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

    if (service.categoryValue === 'additional') {
      row.defaults!.additionalServiceIds.push(service.id)
    } else {
      row.serviceId = String(service.id)
    }
  }

  return [...rowsByItemId.values()]
}

export default function Edit({ order, items: orderItems, services }: PageProps) {
  const { items, addItem, removeItem, setServiceId } = useItemRows(toItemRows(orderItems))

  const inspectionPhoto = order.actions?.find(
    (action) => action.name === 'Inspeksi Selesai'
  )?.photoPath

  return (
    <StaffLayout
      title={`Ubah Barang - ${order.orderNumber}`}
      description="Perbaiki data barang sebelum pelanggan melunasi"
    >
      <div className="flex items-center gap-3 px-6 py-5">
        <Link
          route="staff.trip.index"
          aria-label="Kembali ke antrean"
          className="flex size-9 items-center justify-center rounded-full border border-gray-300 text-black transition-colors hover:bg-gray-100 active:scale-95"
        >
          <IconArrowLeft className="size-5" />
        </Link>
        <div>
          <p className="text-xs tracking-[0.3em] text-gray-600 uppercase font-medium">
            Ubah Barang
          </p>
          <h1 className="text-2xl font-bold tracking-tight text-black">{order.orderNumber}</h1>
        </div>
      </div>

      <div className="flex-1 space-y-4 px-6 pb-28">
        <Card className="rounded-2xl border border-gray-200 bg-gray-50 p-5">
          <p className="text-sm leading-relaxed text-gray-700">
            Perbaiki merek, model, atau layanan yang salah sebelum pelanggan melunasi. Setelah
            dilunasi, data barang tidak dapat diubah lagi.
          </p>
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">Total saat ini</span>
            <span className="font-semibold text-black">{order.totalPrice ?? '-'}</span>
          </div>
        </Card>

        {inspectionPhoto && (
          <Card className="rounded-2xl border border-gray-200 bg-gray-50">
            <CardHeader>
              <p className="text-xs tracking-widest text-gray-600 uppercase font-medium">
                Foto Inspeksi
              </p>
            </CardHeader>
            <CardContent>
              <img
                src={inspectionPhoto}
                alt="Foto inspeksi"
                className="aspect-video w-full rounded-xl border border-gray-200 object-cover"
              />
            </CardContent>
          </Card>
        )}

        <Form
          route="staff.order.update"
          routeParams={{ number: order.orderNumber }}
          className="space-y-4"
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

              <Button
                type="button"
                variant="outline"
                onClick={addItem}
                className="h-11 w-full rounded-xl text-sm font-semibold tracking-wide text-black active:scale-95"
              >
                Tambah Barang
              </Button>

              <Button
                type="submit"
                disabled={processing}
                className="h-12 w-full rounded-xl bg-black text-base font-semibold tracking-wide text-white hover:bg-black/90 active:scale-95"
              >
                Simpan Barang
              </Button>
            </>
          )}
        </Form>

        <Link
          route="staff.trip.index"
          className={buttonVariants({
            variant: 'outline',
            className:
              'h-12 w-full rounded-xl text-base font-semibold tracking-wide text-black active:scale-95',
          })}
        >
          Sudah Benar
        </Link>
      </div>
    </StaffLayout>
  )
}
