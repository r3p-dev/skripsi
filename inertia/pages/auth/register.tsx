import { PasswordInput } from '@/components/atoms/password-input'
import { PhoneInput } from '@/components/atoms/phone-input'
import AuthLayout from '@/components/layouts/auth-layout'
import { Button } from '@/components/ui/button'
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldSet,
} from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Spinner } from '@/components/ui/spinner'
import { Form, Link } from '@adonisjs/inertia/react'
import { Head } from '@inertiajs/react'

export default function Register() {
  return (
    <AuthLayout title="Buat akun" description="Masukkan detail Anda di bawah untuk membuat akun">
      <Head title="Registrasi" />

      <Form route="register.store" disableWhileProcessing resetOnSuccess>
        {({ errors, processing }) => (
          <>
            <FieldSet>
              <FieldGroup>
                <Field data-invalid={errors.name ? 'true' : undefined}>
                  <FieldLabel className="text-sm">Nama Lengkap</FieldLabel>
                  <Input
                    className="h-10 px-3 py-1"
                    name="name"
                    placeholder="Masukkan nama lengkap"
                  />
                  <FieldError errors={errors.name ? [{ message: errors.name }] : undefined} />
                </Field>

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
                  <FieldLabel className="text-sm">Kata Sandi</FieldLabel>
                  <PasswordInput
                    className="h-10 px-3 py-1"
                    name="password"
                    placeholder="Masukkan kata sandi"
                  />
                  <FieldError
                    errors={errors.password ? [{ message: errors.password }] : undefined}
                  />
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
                    {processing ? <Spinner /> : 'Buat akun'}
                  </Button>
                </Field>
              </FieldGroup>
            </FieldSet>

            <div className="text-center text-sm text-muted-foreground mt-6">
              Sudah punya akun?{' '}
              <Link route="session.create" className="underline text-black">
                Masuk
              </Link>
            </div>
          </>
        )}
      </Form>
    </AuthLayout>
  )
}
