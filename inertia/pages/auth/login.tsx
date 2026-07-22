import { PasswordInput } from '@/components/atoms/password_input'
import { PhoneInput } from '@/components/atoms/phone_input'
import AuthLayout from '@/components/layouts/auth_layout'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldSet,
} from '@/components/ui/field'
import { Spinner } from '@/components/ui/spinner'
import { Form, Link } from '@adonisjs/inertia/react'

export default function Login() {
  return (
    <AuthLayout
      title="Masuk"
      description="Masuk ke akun Anda untuk mengakses layanan dan fitur lengkap di platform kami dengan mudah dan aman."
      cardTitle="Masuk ke akun Anda"
      cardDescription="Masukkan detail Anda di bawah untuk masuk ke akun"
    >
      <Form route="session.store" disableWhileProcessing resetOnSuccess>
        {({ errors, processing }) => (
          <>
            <FieldSet>
              <FieldGroup>
                <Field data-invalid={errors.phone ? 'true' : undefined}>
                  <FieldLabel className="text-sm">Nomor Telepon</FieldLabel>
                  <PhoneInput
                    className="h-10 px-3 py-1"
                    name="phone"
                    placeholder="Masukkan nomor telepon"
                  />
                  <FieldDescription>Format: 08xx</FieldDescription>
                  <FieldError errors={errors.phone ? [{ message: errors.phone }] : undefined} />
                </Field>

                <Field data-invalid={errors.password ? 'true' : undefined}>
                  <div className="flex items-center">
                    <FieldLabel className="text-sm">Kata Sandi</FieldLabel>
                    <Link
                      route="password_reset.create"
                      className="ml-auto underline text-black text-sm"
                      tabIndex={5}
                    >
                      Lupa kata sandi?
                    </Link>
                  </div>
                  <PasswordInput
                    className="h-10 px-3 py-1"
                    name="password"
                    placeholder="Masukkan kata sandi"
                  />
                  <FieldError
                    errors={errors.password ? [{ message: errors.password }] : undefined}
                  />
                </Field>

                <Field>
                  <div className="flex items-center space-x-2">
                    <Checkbox name="remember_me" />
                    <FieldLabel className="text-sm">Ingat saya</FieldLabel>
                  </div>
                </Field>

                <Field>
                  <Button type="submit" className="w-full h-10 text-lg cursor-pointer">
                    {processing ? <Spinner /> : 'Masuk'}
                  </Button>
                </Field>
              </FieldGroup>
            </FieldSet>

            <div className="text-center text-sm text-muted-foreground mt-6">
              Belum punya akun?{' '}
              <Link route="signup.create" className="underline text-black">
                Daftar
              </Link>
            </div>
          </>
        )}
      </Form>
    </AuthLayout>
  )
}
