import { PhoneInput } from '@/components/atoms/phone_input'
import { SolidButton, underlineField } from '@/components/atoms/editorial'
import AuthLayout from '@/components/layouts/auth_layout'
import { Field, FieldError, FieldLabel } from '@/components/ui/field'
import { Form, Link } from '@adonisjs/inertia/react'

export default function ForgotPassword() {
  return (
    <AuthLayout
      title="Lupa Kata Sandi"
      description="Masukkan nomor telepon Anda dan kami akan mengirimkan kode atur ulang melalui WhatsApp"
      metaTitle="Lupa Kata Sandi"
      metaDescription="Atur ulang kata sandi akun UmimaClean Anda"
    >
      <Form route="password_reset.store">
        {({ errors, processing }) => (
          <>
            <Field className="mb-6" data-invalid={errors.phone ? 'true' : undefined}>
              <FieldLabel htmlFor="phone" className="field-label mb-2.5">
                Nomor Telepon
              </FieldLabel>
              <PhoneInput
                id="phone"
                name="phone"
                autoComplete="tel"
                aria-invalid={!!errors.phone}
                className={underlineField}
              />
              <FieldError>{errors.phone}</FieldError>
            </Field>

            <SolidButton type="submit" disabled={processing}>
              Kirim Kode Atur Ulang
            </SolidButton>
          </>
        )}
      </Form>

      <p className="mt-8 text-center text-small text-ink-soft">
        Sudah ingat kata sandi?{' '}
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
