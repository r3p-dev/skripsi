import { Card } from '@/components/ui/card'
import { Field, FieldError, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'

export type Option = { value: string; label: string }

export type ServiceDefaults = {
  name: string
  description: string
  price: number
  category: string
  type: string
}

/**
 * The catalogue entry form, shared by the create and edit screens.
 *
 * Both submit the same complete payload — there is no partial update — so the
 * only difference between the two pages is the route they post to and whether
 * the fields start filled.
 */
export function ServiceFields({
  errors,
  defaults,
  categoryOptions,
  typeOptions,
}: {
  errors: Record<string, string | undefined>
  defaults?: ServiceDefaults
  categoryOptions: Option[]
  typeOptions: Option[]
}) {
  return (
    <Card className="rounded-2xl border border-gray-200 bg-gray-50 p-5">
      <Field data-invalid={errors.name ? 'true' : undefined}>
        <FieldLabel htmlFor="name" className="text-xs tracking-widest text-gray-700 uppercase">
          Nama Layanan
        </FieldLabel>
        <Input
          id="name"
          name="name"
          defaultValue={defaults?.name}
          required
          aria-invalid={!!errors.name}
          className="h-11 rounded-xl border-gray-300 bg-white px-4 focus-visible:border-black focus-visible:ring-black/10"
        />
        <FieldError>{errors.name}</FieldError>
      </Field>

      <Field data-invalid={errors.description ? 'true' : undefined}>
        <FieldLabel
          htmlFor="description"
          className="text-xs tracking-widest text-gray-700 uppercase"
        >
          Deskripsi
        </FieldLabel>
        <Textarea
          id="description"
          name="description"
          defaultValue={defaults?.description}
          required
          aria-invalid={!!errors.description}
          className="rounded-xl bg-white"
        />
        <FieldError>{errors.description}</FieldError>
      </Field>

      <Field data-invalid={errors.price ? 'true' : undefined}>
        <FieldLabel htmlFor="price" className="text-xs tracking-widest text-gray-700 uppercase">
          Harga (Rp)
        </FieldLabel>
        <Input
          id="price"
          name="price"
          type="number"
          /*
            Whole Rupiah, and `step` has to stay 1: the browser validates a
            number field as `min + n * step`, so a coarser step would reject
            every ordinary price and block the submit with no message.
          */
          min={1}
          step={1}
          defaultValue={defaults?.price}
          required
          aria-invalid={!!errors.price}
          className="h-11 rounded-xl border-gray-300 bg-white px-4 focus-visible:border-black focus-visible:ring-black/10"
        />
        <FieldError>{errors.price}</FieldError>
      </Field>

      <Field data-invalid={errors.category ? 'true' : undefined}>
        <FieldLabel htmlFor="category" className="text-xs tracking-widest text-gray-700 uppercase">
          Kategori
        </FieldLabel>
        {/*
          The category decides which physical item type the inspection form
          derives for this service, so it is not cosmetic — see
          `itemTypeByCategory` in `item_fields`.
        */}
        <select
          id="category"
          name="category"
          required
          defaultValue={defaults?.category ?? ''}
          className="h-11 w-full rounded-xl border border-gray-300 bg-white px-3 text-sm focus-visible:border-black focus-visible:outline-none"
        >
          <option value="" disabled>
            Pilih kategori
          </option>
          {categoryOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <FieldError>{errors.category}</FieldError>
      </Field>

      <Field data-invalid={errors.type ? 'true' : undefined}>
        <FieldLabel htmlFor="type" className="text-xs tracking-widest text-gray-700 uppercase">
          Tipe Harga
        </FieldLabel>
        <select
          id="type"
          name="type"
          required
          defaultValue={defaults?.type ?? ''}
          className="h-11 w-full rounded-xl border border-gray-300 bg-white px-3 text-sm focus-visible:border-black focus-visible:outline-none"
        >
          <option value="" disabled>
            Pilih tipe harga
          </option>
          {typeOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <FieldError>{errors.type}</FieldError>
      </Field>
    </Card>
  )
}
