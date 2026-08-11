import { PasswordInput } from '@/components/atoms/password_input'
import { SolidButton, underlineField } from '@/components/atoms/editorial'
import AuthLayout from '@/components/layouts/auth_layout'
import { Field, FieldError, FieldLabel } from '@/components/ui/field'
import { Form } from '@adonisjs/inertia/react'

export default function ResetPassword() {
  return (
    <AuthLayout
      title="Atur Ulang Kata Sandi"
      description="Masukkan kata sandi baru Anda di bawah ini"
      metaTitle="Atur Ulang Kata Sandi"
      metaDescription="Atur ulang kata sandi akun UmimaClean Anda"
    >
      <Form action={window.location.href} method="post">
        {({ errors, processing }) => (
          <>
            <Field className="mb-6" data-invalid={errors.password ? 'true' : undefined}>
              <FieldLabel htmlFor="password" className="field-label mb-2.5">
                Kata Sandi
              </FieldLabel>
              <PasswordInput
                id="password"
                name="password"
                autoComplete="new-password"
                aria-invalid={!!errors.password}
                className={underlineField}
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
                className={underlineField}
              />
              <FieldError>{errors.passwordConfirmation}</FieldError>
            </Field>

            <SolidButton type="submit" disabled={processing}>
              Atur Ulang Kata Sandi
            </SolidButton>
          </>
        )}
      </Form>
    </AuthLayout>
  )
}
