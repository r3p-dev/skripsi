import AdminLayout from '@/components/layouts/admin_layout'
import { PasswordInput } from '@/components/atoms/password_input'
import { PhoneInput } from '@/components/atoms/phone_input'
import { PageHeader } from '@/components/molecules/page_header'
import { Button, buttonVariants } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Field, FieldError, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
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
            className={buttonVariants({
              variant: 'outline',
              className: 'rounded-none border-rule-field',
            })}
          >
            <IconArrowLeft className="size-4" />
            Kembali
          </Link>
        }
      />

      <Form
        route="admin.user.update"
        routeParams={{ id: account.id }}
        className="max-w-2xl space-y-4"
      >
        {({ errors, processing }) => (
          <>
            <Card className="rounded-none border border-rule bg-paper-tint p-5">
              <Field data-invalid={errors.name ? 'true' : undefined}>
                <FieldLabel
                  htmlFor="name"
                  className="text-xs tracking-widest text-ink-body uppercase"
                >
                  Nama Lengkap
                </FieldLabel>
                <Input
                  id="name"
                  name="name"
                  defaultValue={account.name}
                  autoComplete="name"
                  required
                  aria-invalid={!!errors.name}
                  className="h-11 rounded-none border-rule-field bg-white px-4 focus-visible:border-ink focus-visible:ring-black/10"
                />
                <FieldError>{errors.name}</FieldError>
              </Field>

              <Field data-invalid={errors.phone ? 'true' : undefined}>
                <FieldLabel
                  htmlFor="phone"
                  className="text-xs tracking-widest text-ink-body uppercase"
                >
                  Nomor Telepon
                </FieldLabel>
                <PhoneInput
                  id="phone"
                  name="phone"
                  defaultValue={account.phone}
                  autoComplete="tel"
                  aria-invalid={!!errors.phone}
                  className="h-11 rounded-none border-rule-field bg-white px-4 focus-visible:border-ink focus-visible:ring-black/10"
                />
                <FieldError>{errors.phone}</FieldError>
                <p className="text-xs text-ink-subtle">
                  Diubah langsung tanpa verifikasi WhatsApp — gunakan hanya untuk memperbaiki
                  kesalahan pengetikan.
                </p>
              </Field>

              <Field data-invalid={errors.role ? 'true' : undefined}>
                <FieldLabel
                  htmlFor="role"
                  className="text-xs tracking-widest text-ink-body uppercase"
                >
                  Peran
                </FieldLabel>
                <select
                  id="role"
                  name="role"
                  required
                  disabled={isSelf}
                  defaultValue={account.role}
                  className="h-11 w-full rounded-none border border-rule-field bg-white px-3 text-sm focus-visible:border-ink focus-visible:outline-none disabled:bg-paper-tint disabled:text-ink-subtle"
                >
                  {roleOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                {isSelf && (
                  <>
                    <input type="hidden" name="role" value={account.role} />
                    <p className="text-xs text-ink-subtle">
                      Anda tidak dapat mengubah peran akun Anda sendiri.
                    </p>
                  </>
                )}
                <FieldError>{errors.role}</FieldError>
              </Field>

              <Field data-invalid={errors.isActive ? 'true' : undefined}>
                <FieldLabel
                  htmlFor="isActive"
                  className="text-xs tracking-widest text-ink-body uppercase"
                >
                  Status Akun
                </FieldLabel>
                <select
                  id="isActive"
                  name="isActive"
                  required
                  disabled={isSelf}
                  defaultValue={account.isActive ? 'true' : 'false'}
                  className="h-11 w-full rounded-none border border-rule-field bg-white px-3 text-sm focus-visible:border-ink focus-visible:outline-none disabled:bg-paper-tint disabled:text-ink-subtle"
                >
                  <option value="true">Aktif</option>
                  <option value="false">Nonaktif — tidak dapat masuk</option>
                </select>
                {isSelf ? (
                  <>
                    <input type="hidden" name="isActive" value="true" />
                    <p className="text-xs text-ink-subtle">
                      Anda tidak dapat menonaktifkan akun Anda sendiri.
                    </p>
                  </>
                ) : (
                  <p className="text-xs text-ink-subtle">
                    Akun nonaktif tidak bisa masuk, tetapi seluruh riwayat pesanan dan tugasnya
                    tetap tersimpan.
                  </p>
                )}
                <FieldError>{errors.isActive}</FieldError>
              </Field>
            </Card>

            <Card className="rounded-none border border-rule bg-paper-tint p-5">
              <p className="text-xs font-medium tracking-widest text-ink-soft uppercase">
                Ganti Kata Sandi
              </p>
              <p className="text-xs text-ink-subtle">
                Kosongkan jika kata sandi tidak perlu diubah.
              </p>

              <Field data-invalid={errors.password ? 'true' : undefined}>
                <FieldLabel
                  htmlFor="password"
                  className="text-xs tracking-widest text-ink-body uppercase"
                >
                  Kata Sandi Baru
                </FieldLabel>
                <PasswordInput
                  id="password"
                  name="password"
                  autoComplete="new-password"
                  aria-invalid={!!errors.password}
                  className="h-11 rounded-none border-rule-field bg-white px-4 focus-visible:border-ink focus-visible:ring-black/10"
                />
                <FieldError>{errors.password}</FieldError>
              </Field>

              <Field data-invalid={errors.passwordConfirmation ? 'true' : undefined}>
                <FieldLabel
                  htmlFor="passwordConfirmation"
                  className="text-xs tracking-widest text-ink-body uppercase"
                >
                  Konfirmasi Kata Sandi
                </FieldLabel>
                <PasswordInput
                  id="passwordConfirmation"
                  name="passwordConfirmation"
                  autoComplete="new-password"
                  aria-invalid={!!errors.passwordConfirmation}
                  className="h-11 rounded-none border-rule-field bg-white px-4 focus-visible:border-ink focus-visible:ring-black/10"
                />
                <FieldError>{errors.passwordConfirmation}</FieldError>
              </Field>
            </Card>

            <Button
              type="submit"
              disabled={processing}
              className="h-12 w-full rounded-none bg-ink text-base font-semibold text-white hover:bg-ink/90 active:scale-95"
            >
              Simpan Perubahan
            </Button>
          </>
        )}
      </Form>
    </AdminLayout>
  )
}
