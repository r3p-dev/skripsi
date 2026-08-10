import AdminLayout from '@/components/layouts/admin_layout'
import { PasswordInput } from '@/components/atoms/password_input'
import { PhoneInput } from '@/components/atoms/phone_input'
import { PageHeader } from '@/components/molecules/page_header'
import { Button, buttonVariants } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Field, FieldError, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
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

      <Form route="admin.user.store" className="max-w-2xl space-y-4">
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
                  autoComplete="tel"
                  aria-invalid={!!errors.phone}
                  className="h-11 rounded-none border-rule-field bg-white px-4 focus-visible:border-ink focus-visible:ring-black/10"
                />
                <FieldError>{errors.phone}</FieldError>
                <p className="text-xs text-ink-subtle">
                  Nomor ini dipakai untuk masuk, jadi harus belum terdaftar.
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
                  defaultValue=""
                  className="h-11 w-full rounded-none border border-rule-field bg-white px-3 text-sm focus-visible:border-ink focus-visible:outline-none"
                >
                  <option value="" disabled>
                    Pilih peran
                  </option>
                  {roleOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <FieldError>{errors.role}</FieldError>
              </Field>

              <Field data-invalid={errors.password ? 'true' : undefined}>
                <FieldLabel
                  htmlFor="password"
                  className="text-xs tracking-widest text-ink-body uppercase"
                >
                  Kata Sandi
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
              Buat Akun
            </Button>
          </>
        )}
      </Form>
    </AdminLayout>
  )
}
