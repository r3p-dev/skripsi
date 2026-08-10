import { PasswordInput } from '@/components/atoms/password_input'
import { PhoneInput } from '@/components/atoms/phone_input'
import { SolidButton, UnderlineInput } from '@/components/atoms/editorial'
import AuthLayout from '@/components/layouts/auth_layout'
import { Field, FieldError, FieldLabel } from '@/components/ui/field'
import { Form, Link } from '@adonisjs/inertia/react'

export default function Signup() {
  return (
    <AuthLayout
      title="Daftar"
      description="Masukkan detail Anda di bawah ini untuk membuat akun baru"
      metaTitle="Daftar"
      metaDescription="Buat akun UmimaClean baru"
    >
      <Form route="signup.store">
        {({ errors, processing }) => (
          <>
            <Field className="mb-6" data-invalid={errors.name ? 'true' : undefined}>
              <FieldLabel htmlFor="name" className="field-label mb-2.5">
                Nama Lengkap
              </FieldLabel>
              <UnderlineInput
                id="name"
                name="name"
                type="text"
                autoComplete="name"
                aria-invalid={!!errors.name}
                className="underline-field h-auto placeholder:text-ink-faint focus-visible:border-ink focus-visible:ring-0"
              />
              <FieldError>{errors.name}</FieldError>
            </Field>

            <Field className="mb-6" data-invalid={errors.phone ? 'true' : undefined}>
              <FieldLabel htmlFor="phone" className="field-label mb-2.5">
                Nomor Telepon
              </FieldLabel>
              <PhoneInput
                id="phone"
                name="phone"
                autoComplete="tel"
                aria-invalid={!!errors.phone}
                className="underline-field h-auto placeholder:text-ink-faint focus-visible:border-ink focus-visible:ring-0"
              />
              <FieldError>{errors.phone}</FieldError>
            </Field>

            <Field className="mb-6" data-invalid={errors.password ? 'true' : undefined}>
              <FieldLabel htmlFor="password" className="field-label mb-2.5">
                Kata Sandi
              </FieldLabel>
              <PasswordInput
                id="password"
                name="password"
                autoComplete="new-password"
                aria-invalid={!!errors.password}
                className="underline-field h-auto placeholder:text-ink-faint focus-visible:border-ink focus-visible:ring-0"
              />
              <FieldError>{errors.password}</FieldError>
            </Field>

            <Field className="mb-6" data-invalid={errors.passwordConfirmation ? 'true' : undefined}>
              <FieldLabel htmlFor="passwordConfirmation" className="field-label mb-2.5">
                Konfirmasi Kata Sandi
              </FieldLabel>
              <PasswordInput
                id="passwordConfirmation"
                name="passwordConfirmation"
                autoComplete="new-password"
                aria-invalid={!!errors.passwordConfirmation}
                className="underline-field h-auto placeholder:text-ink-faint focus-visible:border-ink focus-visible:ring-0"
              />
              <FieldError>{errors.passwordConfirmation}</FieldError>
            </Field>

            <SolidButton type="submit" disabled={processing}>
              Daftar
            </SolidButton>
          </>
        )}
      </Form>

      <p className="mt-8 text-center text-small text-ink-soft">
        Sudah punya akun?{' '}
        <Link
          route="session.create"
          className="font-semibold text-ink underline underline-offset-4"
        >
          Masuk
        </Link>
      </p>
    </AuthLayout>
  )
}
