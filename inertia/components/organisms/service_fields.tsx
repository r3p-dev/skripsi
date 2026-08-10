import { Card } from '@/components/ui/card'
import { Field, FieldError, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'

export type Option = { value: string; label: string }

export type ServiceDefaults = {
  serviceName: string
  description: string
  price: number
  category: string
  type: string
}

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
    <Card className="rounded-none border border-rule bg-paper-tint p-5">
      <Field data-invalid={errors.serviceName ? 'true' : undefined}>
        <FieldLabel
          htmlFor="serviceName"
          className="text-xs tracking-widest text-ink-body uppercase"
        >
          Nama Layanan
        </FieldLabel>
        <Input
          id="serviceName"
          name="serviceName"
          defaultValue={defaults?.serviceName}
          required
          aria-invalid={!!errors.serviceName}
          className="h-11 rounded-none border-rule-field bg-white px-4 focus-visible:border-ink focus-visible:ring-black/10"
        />
        <FieldError>{errors.serviceName}</FieldError>
      </Field>

      <Field data-invalid={errors.description ? 'true' : undefined}>
        <FieldLabel
          htmlFor="description"
          className="text-xs tracking-widest text-ink-body uppercase"
        >
          Deskripsi
        </FieldLabel>
        <Textarea
          id="description"
          name="description"
          defaultValue={defaults?.description}
          required
          aria-invalid={!!errors.description}
          className="rounded-none bg-white"
        />
        <FieldError>{errors.description}</FieldError>
      </Field>

      <Field data-invalid={errors.price ? 'true' : undefined}>
        <FieldLabel htmlFor="price" className="text-xs tracking-widest text-ink-body uppercase">
          Harga (Rp)
        </FieldLabel>
        <Input
          id="price"
          name="price"
          type="number"
          min={1}
          step={1}
          defaultValue={defaults?.price}
          required
          aria-invalid={!!errors.price}
          className="h-11 rounded-none border-rule-field bg-white px-4 focus-visible:border-ink focus-visible:ring-black/10"
        />
        <FieldError>{errors.price}</FieldError>
      </Field>

      <Field data-invalid={errors.category ? 'true' : undefined}>
        <FieldLabel htmlFor="category" className="text-xs tracking-widest text-ink-body uppercase">
          Kategori
        </FieldLabel>
        <select
          id="category"
          name="category"
          required
          defaultValue={defaults?.category ?? ''}
          className="h-11 w-full rounded-none border border-rule-field bg-white px-3 text-sm focus-visible:border-ink focus-visible:outline-none"
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
        <FieldLabel htmlFor="type" className="text-xs tracking-widest text-ink-body uppercase">
          Tipe Harga
        </FieldLabel>
        <select
          id="type"
          name="type"
          required
          defaultValue={defaults?.type ?? ''}
          className="h-11 w-full rounded-none border border-rule-field bg-white px-3 text-sm focus-visible:border-ink focus-visible:outline-none"
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
