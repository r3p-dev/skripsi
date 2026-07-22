import { PasswordInput } from '@/components/atoms/password_input'
import AuthLayout from '@/components/layouts/auth_layout'
import { Button } from '@/components/ui/button'
import { Field, FieldError, FieldGroup, FieldLabel, FieldSet } from '@/components/ui/field'
import { Spinner } from '@/components/ui/spinner'
import { Form } from '@adonisjs/inertia/react'

export default function ResetPassword() {
  return (
    <AuthLayout
      title="Reset kata sandi"
      description="Atur ulang kata sandi akun Anda untuk meningkatkan keamanan dan kembali mengakses layanan dengan kredensial baru."
      cardTitle="Reset kata sandi"
      cardDescription="Masukkan detail Anda di bawah untuk reset kata sandi"
    >
      <Form route="password_reset.update" disableWhileProcessing resetOnSuccess>
        {({ errors, processing }) => (
          <FieldSet>
            <FieldGroup>
              <Field data-invalid={errors.password ? 'true' : undefined}>
                <FieldLabel className="text-sm">Kata Sandi</FieldLabel>
                <PasswordInput
                  className="h-10 px-3 py-1"
                  name="password"
                  placeholder="Masukkan kata sandi"
                />
                <FieldError errors={errors.password ? [{ message: errors.password }] : undefined} />
              </Field>

              <Field data-invalid={errors.password_confirmation ? 'true' : undefined}>
                <FieldLabel className="text-sm">Konfirmasi Kata Sandi</FieldLabel>
                <PasswordInput
                  className="h-10 px-3 py-1"
                  name="password_confirmation"
                  placeholder="Masukkan konfirmasi kata sandi"
                />
                <FieldError
                  errors={
                    errors.password_confirmation
                      ? [{ message: errors.password_confirmation }]
                      : undefined
                  }
                />
              </Field>

              <Field>
                <Button type="submit" className="w-full h-10 text-lg cursor-pointer">
                  {processing ? <Spinner /> : 'Reset Kata Sandi'}
                </Button>
              </Field>
            </FieldGroup>
          </FieldSet>
        )}
      </Form>
    </AuthLayout>
  )
}
