import { Card } from '@/components/ui/card'
import { Field, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import type { Data } from '@/generated/data'
import { CatalogueCategory } from '@/enums/catalogue_enum'
import { ItemType } from '@/enums/item_enum'
import { formatRupiah } from '@/lib/format'
import { IconTrash } from '@tabler/icons-react'
import { useRef, useState } from 'react'

const itemTypeByCategory: Record<string, string> = {
  [CatalogueCategory.SHOE_WASH]: ItemType.SHOE,
  [CatalogueCategory.SHOE_REPAIR]: ItemType.SHOE,
  [CatalogueCategory.BAG_WASH]: ItemType.BAG,
  [CatalogueCategory.HELMET_WASH]: ItemType.HELMET,
}

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
  const mainServices = services.filter(
    (service) => service.category !== CatalogueCategory.ADDITIONAL
  )
  const additionalServices = services.filter(
    (service) => service.category === CatalogueCategory.ADDITIONAL
  )
  const selectedService = services.find((service) => String(service.id) === serviceId)
  const itemType = selectedService ? (itemTypeByCategory[selectedService.category] ?? '') : ''

  return (
    <div className="space-y-3">
      <input type="hidden" name={`items[${index}][type]`} value={itemType} />

      <div className="grid grid-cols-2 gap-3">
        <Field>
          <FieldLabel className="text-xs tracking-widest text-ink-body uppercase">Merek</FieldLabel>
          <Input
            name={`items[${index}][brand]`}
            defaultValue={defaults?.brand}
            required
            className="h-11 rounded-none"
          />
        </Field>
        <Field>
          <FieldLabel className="text-xs tracking-widest text-ink-body uppercase">Model</FieldLabel>
          <Input
            name={`items[${index}][model]`}
            defaultValue={defaults?.model}
            required
            className="h-11 rounded-none"
          />
        </Field>
        <Field>
          <FieldLabel className="text-xs tracking-widest text-ink-body uppercase">Bahan</FieldLabel>
          <Input
            name={`items[${index}][material]`}
            defaultValue={defaults?.material}
            required
            className="h-11 rounded-none"
          />
        </Field>
        <Field>
          <FieldLabel className="text-xs tracking-widest text-ink-body uppercase">
            Ukuran
          </FieldLabel>
          <Input
            name={`items[${index}][size]`}
            defaultValue={defaults?.size}
            required
            className="h-11 rounded-none"
          />
        </Field>
      </div>

      <Field>
        <FieldLabel className="text-xs tracking-widest text-ink-body uppercase">Kondisi</FieldLabel>
        <Input
          name={`items[${index}][condition]`}
          defaultValue={defaults?.condition}
          required
          className="h-11 rounded-none"
        />
      </Field>

      <Field>
        <FieldLabel className="text-xs tracking-widest text-ink-body uppercase">Catatan</FieldLabel>
        <Textarea
          name={`items[${index}][note]`}
          defaultValue={defaults?.note}
          className="rounded-none"
        />
      </Field>

      <Field>
        <FieldLabel className="text-xs tracking-widest text-ink-body uppercase">Layanan</FieldLabel>
        <select
          name={`items[${index}][service]`}
          value={serviceId}
          onChange={(event) => onServiceChange(event.target.value)}
          required
          className="h-11 w-full rounded-none border border-rule-field bg-white px-3 text-sm focus-visible:border-ink focus-visible:outline-none"
        >
          <option value="">Pilih layanan</option>
          {mainServices.map((service) => (
            <option key={service.id} value={service.id}>
              {service.name} - {formatRupiah(service.price)}
            </option>
          ))}
        </select>
      </Field>

      {additionalServices.length > 0 && (
        <Field>
          <FieldLabel className="text-xs tracking-widest text-ink-body uppercase">
            Layanan Tambahan
          </FieldLabel>
          <div className="space-y-2 rounded-none border border-rule-field bg-white p-3">
            {additionalServices.map((service) => (
              <label
                key={service.id}
                className="flex min-h-11 items-center gap-3 text-sm text-ink-body"
              >
                <input
                  type="checkbox"
                  name={`items[${index}][additionalServices][]`}
                  value={service.id}
                  defaultChecked={defaults?.additionalServiceIds.includes(service.id)}
                  className="size-5 shrink-0 rounded border-rule-field"
                />
                {service.name} - {formatRupiah(service.price)}
              </label>
            ))}
          </div>
        </Field>
      )}
    </div>
  )
}

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
    <Card className="rounded-none border border-rule bg-paper-tint p-5">
      <div className="flex items-center justify-between">
        <p className="text-xs tracking-widest text-ink-soft uppercase font-medium">
          Barang {index + 1}
        </p>
        {canRemove && (
          <button
            type="button"
            onClick={onRemove}
            aria-label={`Hapus barang ${index + 1}`}
            className="-my-2 flex size-11 items-center justify-center rounded-full text-ink-subtle hover:bg-paper-tint"
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
