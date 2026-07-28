import { Card } from '@/components/ui/card'
import { Field, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import type { Data } from '@/generated/data'
import { IconTrash } from '@tabler/icons-react'
import { useRef, useState } from 'react'

/**
 * Maps a service's category to the physical item type it implies,
 * so staff don't have to pick the item type separately.
 */
const itemTypeByCategory: Record<string, string> = {
  shoe_wash: 'shoe',
  shoe_repair: 'shoe',
  bag_wash: 'bag',
  helmet_wash: 'helmet',
}

/**
 * The values an already-recorded item starts the form with, used when staff
 * correct the items on an order that has been inspected but not yet paid.
 */
export type ItemDefaults = {
  brand: string
  model: string
  material: string
  size: string
  condition: string
  note: string
  additionalServiceIds: number[]
}

export type ItemRow = {
  key: number
  serviceId: string
  defaults?: ItemDefaults
}

/**
 * Manages a dynamic, addable/removable list of inspected or
 * offline-order items, each tracking only the service it needs
 * to derive the item's physical type.
 *
 * Pass `initialRows` to edit items that already exist; a new item form starts
 * with one empty row.
 */
export function useItemRows(initialRows?: ItemRow[]) {
  const [items, setItems] = useState<ItemRow[]>(initialRows ?? [{ key: 0, serviceId: '' }])
  const nextKey = useRef(items.length)

  function addItem() {
    setItems((prev) => [...prev, { key: nextKey.current++, serviceId: '' }])
  }

  function removeItem(key: number) {
    setItems((prev) => prev.filter((item) => item.key !== key))
  }

  function setServiceId(key: number, serviceId: string) {
    setItems((prev) => prev.map((item) => (item.key === key ? { ...item, serviceId } : item)))
  }

  return { items, addItem, removeItem, setServiceId }
}

/**
 * Renders the input fields for a single item: physical details,
 * the main service (used to derive the item's type), and any
 * additional services.
 */
function ItemFields({
  index,
  services,
  serviceId,
  defaults,
  onServiceChange,
}: {
  index: number
  services: Data.Service[]
  serviceId: string
  defaults?: ItemDefaults
  onServiceChange: (serviceId: string) => void
}) {
  const mainServices = services.filter((service) => service.categoryValue !== 'additional')
  const additionalServices = services.filter((service) => service.categoryValue === 'additional')
  const selectedService = services.find((service) => String(service.id) === serviceId)
  const itemType = selectedService ? (itemTypeByCategory[selectedService.categoryValue] ?? '') : ''

  return (
    <div className="space-y-3">
      <input type="hidden" name={`items[${index}][type]`} value={itemType} />

      <div className="grid grid-cols-2 gap-3">
        <Field>
          <FieldLabel className="text-xs tracking-widest text-gray-700 uppercase">Merek</FieldLabel>
          <Input
            name={`items[${index}][brand]`}
            defaultValue={defaults?.brand}
            required
            className="h-11 rounded-xl"
          />
        </Field>
        <Field>
          <FieldLabel className="text-xs tracking-widest text-gray-700 uppercase">Model</FieldLabel>
          <Input
            name={`items[${index}][model]`}
            defaultValue={defaults?.model}
            required
            className="h-11 rounded-xl"
          />
        </Field>
        <Field>
          <FieldLabel className="text-xs tracking-widest text-gray-700 uppercase">Bahan</FieldLabel>
          <Input
            name={`items[${index}][material]`}
            defaultValue={defaults?.material}
            required
            className="h-11 rounded-xl"
          />
        </Field>
        <Field>
          <FieldLabel className="text-xs tracking-widest text-gray-700 uppercase">
            Ukuran
          </FieldLabel>
          <Input
            name={`items[${index}][size]`}
            defaultValue={defaults?.size}
            required
            className="h-11 rounded-xl"
          />
        </Field>
      </div>

      <Field>
        <FieldLabel className="text-xs tracking-widest text-gray-700 uppercase">Kondisi</FieldLabel>
        <Input
          name={`items[${index}][condition]`}
          defaultValue={defaults?.condition}
          required
          className="h-11 rounded-xl"
        />
      </Field>

      <Field>
        <FieldLabel className="text-xs tracking-widest text-gray-700 uppercase">Catatan</FieldLabel>
        <Textarea
          name={`items[${index}][note]`}
          defaultValue={defaults?.note}
          className="rounded-xl"
        />
      </Field>

      <Field>
        <FieldLabel className="text-xs tracking-widest text-gray-700 uppercase">Layanan</FieldLabel>
        <select
          name={`items[${index}][service]`}
          value={serviceId}
          onChange={(event) => onServiceChange(event.target.value)}
          required
          className="h-11 w-full rounded-xl border border-gray-300 bg-white px-3 text-sm focus-visible:border-black focus-visible:outline-none"
        >
          <option value="">Pilih layanan</option>
          {mainServices.map((service) => (
            <option key={service.id} value={service.id}>
              {service.name} - {service.price}
            </option>
          ))}
        </select>
      </Field>

      {additionalServices.length > 0 && (
        <Field>
          <FieldLabel className="text-xs tracking-widest text-gray-700 uppercase">
            Layanan Tambahan
          </FieldLabel>
          <div className="space-y-2 rounded-xl border border-gray-300 bg-white p-3">
            {additionalServices.map((service) => (
              <label key={service.id} className="flex items-center gap-2 text-sm text-gray-700">
                <input
                  type="checkbox"
                  name={`items[${index}][additionalServices][]`}
                  value={service.id}
                  defaultChecked={defaults?.additionalServiceIds.includes(service.id)}
                  className="size-4 rounded border-gray-300"
                />
                {service.name} - {service.price}
              </label>
            ))}
          </div>
        </Field>
      )}
    </div>
  )
}

/**
 * A single "Barang N" card: item fields plus a remove button
 * (hidden when it is the only remaining item).
 */
export function ItemCard({
  index,
  services,
  item,
  canRemove,
  onServiceChange,
  onRemove,
}: {
  index: number
  services: Data.Service[]
  item: ItemRow
  canRemove: boolean
  onServiceChange: (serviceId: string) => void
  onRemove: () => void
}) {
  return (
    <Card className="rounded-2xl border border-gray-200 bg-gray-50 p-5">
      <div className="flex items-center justify-between">
        <p className="text-xs tracking-widest text-gray-600 uppercase font-medium">
          Barang {index + 1}
        </p>
        {canRemove && (
          <button
            type="button"
            onClick={onRemove}
            aria-label={`Hapus barang ${index + 1}`}
            className="flex size-8 items-center justify-center rounded-full text-gray-500 hover:bg-gray-200"
          >
            <IconTrash className="size-4" />
          </button>
        )}
      </div>

      <ItemFields
        index={index}
        services={services}
        serviceId={item.serviceId}
        defaults={item.defaults}
        onServiceChange={onServiceChange}
      />
    </Card>
  )
}
