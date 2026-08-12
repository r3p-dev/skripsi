import AdminLayout from '@/components/layouts/admin_layout'
import { PasswordInput } from '@/components/atoms/password_input'
import { PhoneInput } from '@/components/atoms/phone_input'
import {
  BoxInput,
  BoxSelect,
  Panel,
  SectionLabel,
  SolidButton,
  boxField,
} from '@/components/atoms/editorial'
import { PageHeader } from '@/components/molecules/page_header'
import { Field, FieldError, FieldLabel } from '@/components/ui/field'
import type { Data } from '@/generated/data'
import type { InertiaProps } from '@/types'
import { Form, Link } from '@adonisjs/inertia/react'
import { IconArrowLeft } from '@tabler/icons-react'

type PageProps = InertiaProps<{
  account: Data.User
  roleOptions: { value: string; label: string }[]
  isSelf: boolean
}>

export default function Edit({ account, roleOptions, isSelf }: PageProps) {
  return (
    <AdminLayout title={account.name} description="Ubah akun pengguna UmimaClean">
      <PageHeader
        eyebrow="Pengguna"
        title="Ubah Akun"
        description={account.name}
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

      <Form
        route="admin.user.update"
        routeParams={{ id: account.id }}
        className="flex max-w-2xl flex-col gap-4"
      >
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
                  defaultValue={account.name}
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
                  defaultValue={account.phone}
                  autoComplete="tel"
                  aria-invalid={!!errors.phone}
                  className={boxField}
                />
                <FieldError>{errors.phone}</FieldError>
                <p className="mt-1.5 text-meta leading-normal text-ink-subtle">
                  Diubah langsung tanpa verifikasi WhatsApp — gunakan hanya untuk memperbaiki
                  kesalahan pengetikan.
                </p>
              </Field>

              <Field data-invalid={errors.role ? 'true' : undefined}>
                <FieldLabel htmlFor="role" className="field-label mb-2">
                  Peran
                </FieldLabel>
                <BoxSelect
                  id="role"
                  name="role"
                  required
                  disabled={isSelf}
                  defaultValue={account.role}
                >
                  {roleOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </BoxSelect>
                {isSelf && (
                  <>
                    <input type="hidden" name="role" value={account.role} />
                    <p className="mt-1.5 text-meta leading-normal text-ink-subtle">
                      Anda tidak dapat mengubah peran akun Anda sendiri.
                    </p>
                  </>
                )}
                <FieldError>{errors.role}</FieldError>
              </Field>

              <Field data-invalid={errors.isActive ? 'true' : undefined}>
                <FieldLabel htmlFor="isActive" className="field-label mb-2">
                  Status Akun
                </FieldLabel>
                <BoxSelect
                  id="isActive"
                  name="isActive"
                  required
                  disabled={isSelf}
                  defaultValue={account.isActive ? 'true' : 'false'}
                >
                  <option value="true">Aktif</option>
                  <option value="false">Nonaktif — tidak dapat masuk</option>
                </BoxSelect>
                {isSelf ? (
                  <>
                    <input type="hidden" name="isActive" value="true" />
                    <p className="mt-1.5 text-meta leading-normal text-ink-subtle">
                      Anda tidak dapat menonaktifkan akun Anda sendiri.
                    </p>
                  </>
                ) : (
                  <p className="mt-1.5 text-meta leading-normal text-ink-subtle">
                    Akun nonaktif tidak bisa masuk, tetapi seluruh riwayat pesanan dan tugasnya
                    tetap tersimpan.
                  </p>
                )}
                <FieldError>{errors.isActive}</FieldError>
              </Field>
            </Panel>

            <Panel tone="tint" className="flex flex-col gap-5 px-5 py-5">
              <div>
                <SectionLabel>Ganti Kata Sandi</SectionLabel>
                <p className="mt-1.5 mb-0 text-meta leading-normal text-ink-subtle">
                  Kosongkan jika kata sandi tidak perlu diubah.
                </p>
              </div>

              <Field data-invalid={errors.password ? 'true' : undefined}>
                <FieldLabel htmlFor="password" className="field-label mb-2">
                  Kata Sandi Baru
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
              Simpan Perubahan
            </SolidButton>
          </>
        )}
      </Form>
    </AdminLayout>
  )
}
