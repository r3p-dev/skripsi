import AdminLayout from '@/components/layouts/admin_layout'
import { PasswordInput } from '@/components/atoms/password_input'
import { PhoneInput } from '@/components/atoms/phone_input'
import { BoxInput, BoxSelect, Panel, SolidButton, boxField } from '@/components/atoms/editorial'
import { PageHeader } from '@/components/molecules/page_header'
import { Field, FieldError, FieldLabel } from '@/components/ui/field'
import type { InertiaProps } from '@/types'
import { Form, Link } from '@adonisjs/inertia/react'
import { IconArrowLeft } from '@tabler/icons-react'

type PageProps = InertiaProps<{
  roleOptions: { value: string; label: string }[]
}>

export default function Create({ roleOptions }: PageProps) {
  return (
    <AdminLayout title="Akun Baru" description="Buat akun pelanggan, petugas, atau admin">
      <PageHeader
        eyebrow="Pengguna"
        title="Akun Baru"
        description="Pendaftaran publik selalu membuat pelanggan — petugas dan admin dibuat di sini"
        action={
          <Link
            route="admin.user.index"
            className="flex min-h-11 items-center gap-2 border border-rule-field px-4 text-meta font-medium tracking-[0.04em] text-ink transition-colors hover:bg-paper-tint"
          >
            <IconArrowLeft className="size-4" />
            Kembali
          </Link>
        }
      />

      <Form route="admin.user.store" className="flex max-w-2xl flex-col gap-4">
        {({ errors, processing }) => (
          <>
            <Panel tone="tint" className="flex flex-col gap-5 px-5 py-5">
              <Field data-invalid={errors.name ? 'true' : undefined}>
                <FieldLabel htmlFor="name" className="field-label mb-2">
                  Nama Lengkap
                </FieldLabel>
                <BoxInput
                  id="name"
                  name="name"
                  autoComplete="name"
                  required
                  aria-invalid={!!errors.name}
                />
                <FieldError>{errors.name}</FieldError>
              </Field>

              <Field data-invalid={errors.phone ? 'true' : undefined}>
                <FieldLabel htmlFor="phone" className="field-label mb-2">
                  Nomor Telepon
                </FieldLabel>
                <PhoneInput
                  id="phone"
                  name="phone"
                  autoComplete="tel"
                  aria-invalid={!!errors.phone}
                  className={boxField}
                />
                <FieldError>{errors.phone}</FieldError>
                <p className="mt-1.5 text-meta leading-normal text-ink-subtle">
                  Nomor ini dipakai untuk masuk, jadi harus belum terdaftar.
                </p>
              </Field>

              <Field data-invalid={errors.role ? 'true' : undefined}>
                <FieldLabel htmlFor="role" className="field-label mb-2">
                  Peran
                </FieldLabel>
                <BoxSelect id="role" name="role" required defaultValue="">
                  <option value="" disabled>
                    Pilih peran
                  </option>
                  {roleOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </BoxSelect>
                <FieldError>{errors.role}</FieldError>
              </Field>

              <Field data-invalid={errors.password ? 'true' : undefined}>
                <FieldLabel htmlFor="password" className="field-label mb-2">
                  Kata Sandi
                </FieldLabel>
                <PasswordInput
                  id="password"
                  name="password"
                  autoComplete="new-password"
                  aria-invalid={!!errors.password}
                  className={boxField}
                />
                <FieldError>{errors.password}</FieldError>
              </Field>

              <Field data-invalid={errors.passwordConfirmation ? 'true' : undefined}>
                <FieldLabel htmlFor="passwordConfirmation" className="field-label mb-2">
                  Konfirmasi Kata Sandi
                </FieldLabel>
                <PasswordInput
                  id="passwordConfirmation"
                  name="passwordConfirmation"
                  autoComplete="new-password"
                  aria-invalid={!!errors.passwordConfirmation}
                  className={boxField}
                />
                <FieldError>{errors.passwordConfirmation}</FieldError>
              </Field>
            </Panel>

            <SolidButton type="submit" disabled={processing}>
              Buat Akun
            </SolidButton>
          </>
        )}
      </Form>
    </AdminLayout>
  )
}
