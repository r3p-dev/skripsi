import { BoxInput, BoxSelect, BoxTextarea, Panel } from '@/components/atoms/editorial'
import { Field, FieldError, FieldLabel } from '@/components/ui/field'

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
    <Panel tone="tint" className="flex flex-col gap-5 px-5 py-5">
      <Field data-invalid={errors.serviceName ? 'true' : undefined}>
        <FieldLabel htmlFor="serviceName" className="field-label mb-2">
          Nama Layanan
        </FieldLabel>
        <BoxInput
          id="serviceName"
          name="serviceName"
          defaultValue={defaults?.serviceName}
          required
          aria-invalid={!!errors.serviceName}
        />
        <FieldError>{errors.serviceName}</FieldError>
      </Field>

      <Field data-invalid={errors.description ? 'true' : undefined}>
        <FieldLabel htmlFor="description" className="field-label mb-2">
          Deskripsi
        </FieldLabel>
        <BoxTextarea
          id="description"
          name="description"
          defaultValue={defaults?.description}
          required
          aria-invalid={!!errors.description}
        />
        <FieldError>{errors.description}</FieldError>
      </Field>

      <Field data-invalid={errors.price ? 'true' : undefined}>
        <FieldLabel htmlFor="price" className="field-label mb-2">
          Harga (Rp)
        </FieldLabel>
        <BoxInput
          id="price"
          name="price"
          type="number"
          min={1}
          step={1}
          defaultValue={defaults?.price}
          required
          aria-invalid={!!errors.price}
        />
        <FieldError>{errors.price}</FieldError>
      </Field>

      <Field data-invalid={errors.category ? 'true' : undefined}>
        <FieldLabel htmlFor="category" className="field-label mb-2">
          Kategori
        </FieldLabel>
        <BoxSelect id="category" name="category" required defaultValue={defaults?.category ?? ''}>
          <option value="" disabled>
            Pilih kategori
          </option>
          {categoryOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </BoxSelect>
        <FieldError>{errors.category}</FieldError>
      </Field>

      <Field data-invalid={errors.type ? 'true' : undefined}>
        <FieldLabel htmlFor="type" className="field-label mb-2">
          Tipe Harga
        </FieldLabel>
        <BoxSelect id="type" name="type" required defaultValue={defaults?.type ?? ''}>
          <option value="" disabled>
            Pilih tipe harga
          </option>
          {typeOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </BoxSelect>
        <FieldError>{errors.type}</FieldError>
      </Field>
    </Panel>
  )
}
