import {
  BoxInput,
  BoxSelect,
  BoxTextarea,
  IconAction,
  Panel,
  SectionLabel,
} from '@/components/atoms/editorial'
import { Field, FieldLabel } from '@/components/ui/field'
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
    <div className="flex flex-col gap-4">
      <input type="hidden" name={`items[${index}][type]`} value={itemType} />

      <div className="grid grid-cols-2 gap-x-3 gap-y-4">
        <Field>
          <FieldLabel className="field-label mb-2">Merek</FieldLabel>
          <BoxInput name={`items[${index}][brand]`} defaultValue={defaults?.brand} required />
        </Field>
        <Field>
          <FieldLabel className="field-label mb-2">Model</FieldLabel>
          <BoxInput name={`items[${index}][model]`} defaultValue={defaults?.model} required />
        </Field>
        <Field>
          <FieldLabel className="field-label mb-2">Bahan</FieldLabel>
          <BoxInput name={`items[${index}][material]`} defaultValue={defaults?.material} required />
        </Field>
        <Field>
          <FieldLabel className="field-label mb-2">Ukuran</FieldLabel>
          <BoxInput name={`items[${index}][size]`} defaultValue={defaults?.size} required />
        </Field>
      </div>

      <Field>
        <FieldLabel className="field-label mb-2">Kondisi</FieldLabel>
        <BoxInput name={`items[${index}][condition]`} defaultValue={defaults?.condition} required />
      </Field>

      <Field>
        <FieldLabel className="field-label mb-2">Catatan</FieldLabel>
        <BoxTextarea name={`items[${index}][note]`} defaultValue={defaults?.note} />
      </Field>

      <Field>
        <FieldLabel className="field-label mb-2">Layanan</FieldLabel>
        <BoxSelect
          name={`items[${index}][service]`}
          value={serviceId}
          onChange={(event) => onServiceChange(event.target.value)}
          required
        >
          <option value="">Pilih layanan</option>
          {mainServices.map((service) => (
            <option key={service.id} value={service.id}>
              {service.name} - {formatRupiah(service.price)}
            </option>
          ))}
        </BoxSelect>
      </Field>

      {additionalServices.length > 0 && (
        <Field>
          <FieldLabel className="field-label mb-2">Layanan Tambahan</FieldLabel>
          <div className="border border-rule-field bg-white px-3.5">
            {additionalServices.map((service) => (
              <label
                key={service.id}
                className="flex min-h-11 items-center gap-3 border-b border-rule py-2 text-small leading-normal text-ink-body last:border-b-0"
              >
                <input
                  type="checkbox"
                  name={`items[${index}][additionalServices][]`}
                  value={service.id}
                  defaultChecked={defaults?.additionalServiceIds.includes(service.id)}
                  className="size-4.5 shrink-0 rounded-xs border-rule-field accent-ink"
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
    <Panel tone="tint">
      <div className="flex items-center justify-between gap-3 border-b border-rule px-5 py-3">
        <SectionLabel>Barang {index + 1}</SectionLabel>
        {canRemove && (
          <IconAction
            destructive
            onClick={onRemove}
            aria-label={`Hapus barang ${index + 1}`}
            className="-my-1"
          >
            <IconTrash className="size-4" />
          </IconAction>
        )}
      </div>

      <div className="px-5 py-5">
        <ItemFields
          index={index}
          services={services}
          serviceId={item.serviceId}
          defaults={item.defaults}
          onServiceChange={onServiceChange}
        />
      </div>
    </Panel>
  )
}
