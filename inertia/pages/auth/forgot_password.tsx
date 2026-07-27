import { PhoneInput } from '@/components/atoms/phone_input'
import AuthLayout from '@/components/layouts/auth_layout'
import { Button } from '@/components/ui/button'
import { Field, FieldError, FieldLabel } from '@/components/ui/field'
import { Form, Link } from '@adonisjs/inertia/react'
import { IconChevronRight } from '@tabler/icons-react'

export default function ForgotPassword() {
  return (
    <AuthLayout
      title="Lupa Kata Sandi"
      description="Masukkan nomor telepon Anda dan kami akan mengirimkan kode atur ulang melalui WhatsApp"
      metaTitle="Lupa Kata Sandi"
      metaDescription="Atur ulang kata sandi akun UmimaClean Anda"
    >
      <Form route="password_reset.store" className="space-y-5">
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

            <Button
              type="submit"
              disabled={processing}
              className="h-12 w-full rounded-xl bg-black text-lg font-semibold tracking-wide text-white transition-all duration-300 hover:bg-black/90 active:scale-95"
            >
              Kirim Kode Atur Ulang
              <IconChevronRight className="size-5" />
            </Button>
          </>
        )}
      </Form>

      <p className="mt-8 text-center text-sm text-gray-700">
        Sudah ingat kata sandi?{' '}
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
