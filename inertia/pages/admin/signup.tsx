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
import { IconArrowLeft, IconShieldLock } from '@tabler/icons-react'

type PageProps = InertiaProps<{
  roleOptions: { value: string; label: string }[]
}>

/**
 * Registration for the people who work here.
 *
 * The public sign-up form only ever produces customers, deliberately: a form
 * anyone on the internet can reach must not be able to mint an account that
 * reads the shop's takings. So staff and admin accounts get their own
 * sign-up, and it lives here, behind the admin area — an administrator is the
 * only person who can open this page and the only person who can submit it.
 */
export default function Signup({ roleOptions }: PageProps) {
  return (
    <AdminLayout title="Daftar Petugas" description="Buat akun petugas atau admin baru">
      <PageHeader
        eyebrow="Admin"
        title="Pendaftaran Petugas"
        description="Hanya admin yang dapat membuka dan mengisi formulir ini"
        action={
          <Link
            route="admin.user.index"
            className={buttonVariants({
              variant: 'outline',
              className: 'rounded-xl border-gray-300',
            })}
          >
            <IconArrowLeft className="size-4" />
            Kembali
          </Link>
        }
      />

      <div className="mb-4 flex max-w-2xl items-start gap-2 rounded-2xl border border-blue-200 bg-blue-50 px-4 py-3">
        <IconShieldLock className="mt-0.5 size-4 shrink-0 text-blue-700" />
        <p className="text-sm text-blue-800">
          Akun petugas dan admin tidak memiliki jalur pendaftaran publik. Formulir ini adalah
          satu-satunya cara membuatnya, dan hanya bisa diakses dari dalam area admin.
        </p>
      </div>

      <Form route="admin.signup.store" className="max-w-2xl space-y-4">
        {({ errors, processing }) => (
          <>
            <Card className="rounded-2xl border border-gray-200 bg-gray-50 p-5">
              <Field data-invalid={errors.name ? 'true' : undefined}>
                <FieldLabel
                  htmlFor="name"
                  className="text-xs tracking-widest text-gray-700 uppercase"
                >
                  Nama Lengkap
                </FieldLabel>
                <Input
                  id="name"
                  name="name"
                  autoComplete="name"
                  required
                  aria-invalid={!!errors.name}
                  className="h-11 rounded-xl border-gray-300 bg-white px-4 focus-visible:border-black focus-visible:ring-black/10"
                />
                <FieldError>{errors.name}</FieldError>
              </Field>

              <Field data-invalid={errors.phone ? 'true' : undefined}>
                <FieldLabel
                  htmlFor="phone"
                  className="text-xs tracking-widest text-gray-700 uppercase"
                >
                  Nomor Telepon
                </FieldLabel>
                <PhoneInput
                  id="phone"
                  name="phone"
                  autoComplete="tel"
                  required
                  aria-invalid={!!errors.phone}
                  className="h-11 rounded-xl border-gray-300 bg-white px-4 focus-visible:border-black focus-visible:ring-black/10"
                />
                <FieldError>{errors.phone}</FieldError>
              </Field>

              <Field data-invalid={errors.role ? 'true' : undefined}>
                <FieldLabel
                  htmlFor="role"
                  className="text-xs tracking-widest text-gray-700 uppercase"
                >
                  Peran
                </FieldLabel>
                <select
                  id="role"
                  name="role"
                  required
                  defaultValue=""
                  className="h-11 w-full rounded-xl border border-gray-300 bg-white px-3 text-sm focus-visible:border-black focus-visible:outline-none"
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
            </Card>

            <Card className="rounded-2xl border border-gray-200 bg-gray-50 p-5">
              <Field data-invalid={errors.password ? 'true' : undefined}>
                <FieldLabel
                  htmlFor="password"
                  className="text-xs tracking-widest text-gray-700 uppercase"
                >
                  Kata Sandi
                </FieldLabel>
                <PasswordInput
                  id="password"
                  name="password"
                  autoComplete="new-password"
                  required
                  aria-invalid={!!errors.password}
                  className="h-11 rounded-xl border-gray-300 bg-white px-4 focus-visible:border-black focus-visible:ring-black/10"
                />
                <FieldError>{errors.password}</FieldError>
              </Field>

              <Field data-invalid={errors.passwordConfirmation ? 'true' : undefined}>
                <FieldLabel
                  htmlFor="passwordConfirmation"
                  className="text-xs tracking-widest text-gray-700 uppercase"
                >
                  Konfirmasi Kata Sandi
                </FieldLabel>
                <PasswordInput
                  id="passwordConfirmation"
                  name="passwordConfirmation"
                  autoComplete="new-password"
                  required
                  aria-invalid={!!errors.passwordConfirmation}
                  className="h-11 rounded-xl border-gray-300 bg-white px-4 focus-visible:border-black focus-visible:ring-black/10"
                />
                <FieldError>{errors.passwordConfirmation}</FieldError>
              </Field>
            </Card>

            <Button
              type="submit"
              disabled={processing}
              className="h-12 w-full rounded-2xl bg-black text-base font-semibold text-white hover:bg-black/90 active:scale-95"
            >
              Daftarkan Akun
            </Button>
          </>
        )}
      </Form>
    </AdminLayout>
  )
}
