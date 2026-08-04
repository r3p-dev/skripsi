import { PasswordInput } from '@/components/atoms/password_input'
import AuthLayout from '@/components/layouts/auth_layout'
import { Button } from '@/components/ui/button'
import { Field, FieldError, FieldLabel } from '@/components/ui/field'
import { Form } from '@adonisjs/inertia/react'
import { IconChevronRight } from '@tabler/icons-react'

export default function ResetPassword() {
  return (
    <AuthLayout
      title="Atur Ulang Kata Sandi"
      description="Masukkan kata sandi baru Anda di bawah ini"
      metaTitle="Atur Ulang Kata Sandi"
      metaDescription="Atur ulang kata sandi akun UmimaClean Anda"
    >
      <Form action={window.location.href} method="post" className="space-y-5">
        {({ errors, processing }) => (
          <>
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
              Atur Ulang Kata Sandi
              <IconChevronRight className="size-5" />
            </Button>
          </>
        )}
      </Form>
    </AuthLayout>
  )
}
