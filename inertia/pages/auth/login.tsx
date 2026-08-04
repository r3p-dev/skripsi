import { PasswordInput } from '@/components/atoms/password_input'
import { PhoneInput } from '@/components/atoms/phone_input'
import AuthLayout from '@/components/layouts/auth_layout'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Field, FieldError, FieldLabel } from '@/components/ui/field'
import { Form, Link } from '@adonisjs/inertia/react'
import { IconChevronRight } from '@tabler/icons-react'

export default function Login() {
  return (
    <AuthLayout
      title="Masuk"
      description="Masukkan nomor telepon dan kata sandi Anda untuk melanjutkan"
      metaTitle="Masuk"
      metaDescription="Masuk ke akun UmimaClean Anda"
    >
      <Form route="session.store" className="space-y-5">
        {({ errors, processing }) => (
          <>
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
                autoComplete="current-password"
                aria-invalid={!!errors.password}
                className="h-12 rounded-xl border-gray-300 bg-gray-50 px-4 focus-visible:border-black focus-visible:ring-black/10"
              />
              <FieldError>{errors.password}</FieldError>
            </Field>

            <div className="flex items-center justify-between">
              <FieldLabel htmlFor="rememberMe" className="gap-2 text-sm font-normal text-gray-700">
                <Checkbox
                  id="rememberMe"
                  name="rememberMe"
                  className="border-gray-300 data-checked:border-black data-checked:bg-black"
                />
                Ingat saya
              </FieldLabel>

              <Link
                route="password_reset.create"
                className="text-xs font-medium tracking-wide text-gray-600 underline underline-offset-4"
              >
                Lupa kata sandi?
              </Link>
            </div>

            <Button
              type="submit"
              disabled={processing}
              className="h-12 w-full rounded-xl bg-black text-lg font-semibold tracking-wide text-white transition-all duration-300 hover:bg-black/90 active:scale-95"
            >
              Masuk
              <IconChevronRight className="size-5" />
            </Button>
          </>
        )}
      </Form>

      <p className="mt-8 text-center text-sm text-gray-700">
        Belum punya akun?{' '}
        <Link
          route="signup.create"
          className="font-semibold text-black underline underline-offset-4"
        >
          Daftar
        </Link>
      </p>
    </AuthLayout>
  )
}
