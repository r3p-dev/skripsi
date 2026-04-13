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
import { Spinner } from '@/components/ui/spinner'
import { Form, Link } from '@adonisjs/inertia/react'
import { Head } from '@inertiajs/react'

export default function ForgotPassword() {
  return (
    <AuthLayout
      title="Lupa kata sandi"
      description="Masukkan nomor telepon Anda untuk menerima tautan reset kata sandi"
    >
      <Head title="Lupa kata sandi" />

      <div className="space-y-6">
        <Form route="forgot_password.store" disableWhileProcessing resetOnSuccess>
          {({ errors, processing }) => (
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

                <Field>
                  <Button type="submit" className="w-full h-10 text-lg cursor-pointer">
                    {processing ? <Spinner /> : 'Kirim tautan reset'}
                  </Button>
                </Field>
              </FieldGroup>
            </FieldSet>
          )}
        </Form>

        <div className="text-center text-sm text-muted-foreground">
          Atau, kembali ke{' '}
          <Link route="session.create" className="underline text-black">
            Masuk
          </Link>
        </div>
      </div>
    </AuthLayout>
  )
}
