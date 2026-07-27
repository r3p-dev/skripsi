import { PasswordInput } from '@/components/atoms/password_input'
import { PhoneInput } from '@/components/atoms/phone_input'
import AuthLayout from '@/components/layouts/auth_layout'
import { Button } from '@/components/ui/button'
import { Field, FieldError, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Form, Link } from '@adonisjs/inertia/react'
import { IconChevronRight } from '@tabler/icons-react'

export default function Signup() {
  return (
    <AuthLayout
      title="Daftar"
      description="Masukkan detail Anda di bawah ini untuk membuat akun baru"
      metaTitle="Daftar"
      metaDescription="Buat akun UmimaClean baru"
    >
      <Form route="signup.store" className="space-y-5">
        {({ errors, processing }) => (
          <>
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
                type="text"
                autoComplete="name"
                aria-invalid={!!errors.name}
                className="h-12 rounded-xl border-gray-300 bg-gray-50 px-4 focus-visible:border-black focus-visible:ring-black/10"
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
                aria-invalid={!!errors.phone}
                className="h-12 rounded-xl border-gray-300 bg-gray-50 px-4 focus-visible:border-black focus-visible:ring-black/10"
              />
              <FieldError>{errors.phone}</FieldError>
            </Field>

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
                aria-invalid={!!errors.password}
                className="h-12 rounded-xl border-gray-300 bg-gray-50 px-4 focus-visible:border-black focus-visible:ring-black/10"
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
                aria-invalid={!!errors.passwordConfirmation}
                className="h-12 rounded-xl border-gray-300 bg-gray-50 px-4 focus-visible:border-black focus-visible:ring-black/10"
              />
              <FieldError>{errors.passwordConfirmation}</FieldError>
            </Field>

            <Button
              type="submit"
              disabled={processing}
              className="h-12 w-full rounded-xl bg-black text-lg font-semibold tracking-wide text-white transition-all duration-300 hover:bg-black/90 active:scale-95"
            >
              Daftar
              <IconChevronRight className="size-5" />
            </Button>
          </>
        )}
      </Form>

      <p className="mt-8 text-center text-sm text-gray-700">
        Sudah punya akun?{' '}
        <Link
          route="session.create"
          className="font-semibold text-black underline underline-offset-4"
        >
          Masuk
        </Link>
      </p>
    </AuthLayout>
  )
}
