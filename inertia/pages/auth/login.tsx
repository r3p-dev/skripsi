import { PasswordInput } from '@/components/atoms/password_input'
import { PhoneInput } from '@/components/atoms/phone_input'
import { OutlineButton, SolidButton, underlineField } from '@/components/atoms/editorial'
import AuthLayout from '@/components/layouts/auth_layout'
import { Checkbox } from '@/components/ui/checkbox'
import { Field, FieldError, FieldLabel } from '@/components/ui/field'
import { Form, Link } from '@adonisjs/inertia/react'

export default function Login() {
  return (
    <AuthLayout
      title="Masuk ke Akun Anda"
      description="Kelola pesanan perawatan sepatu, tas, dan helm Anda."
      metaTitle="Masuk"
      metaDescription="Masuk ke akun UmimaClean Anda"
      audience="Pelanggan"
    >
      <Form route="session.store">
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
                placeholder="08xx-xxxx-xxxx"
                aria-invalid={!!errors.phone}
                className={underlineField}
              />
              <FieldError>{errors.phone}</FieldError>
            </Field>

            <Field className="mb-3" data-invalid={errors.password ? 'true' : undefined}>
              <FieldLabel htmlFor="password" className="field-label mb-2.5">
                Kata Sandi
              </FieldLabel>
              <PasswordInput
                id="password"
                name="password"
                autoComplete="current-password"
                placeholder="••••••••"
                aria-invalid={!!errors.password}
                className={underlineField}
              />
              <FieldError>{errors.password}</FieldError>
            </Field>

            <div className="mb-8 flex items-center justify-between">
              <FieldLabel
                htmlFor="rememberMe"
                className="gap-2 text-small font-normal text-ink-body"
              >
                <Checkbox
                  id="rememberMe"
                  name="rememberMe"
                  className="border-rule-field data-checked:border-ink data-checked:bg-ink"
                />
                Ingat saya
              </FieldLabel>

              <Link route="password_reset.create" className="text-meta text-ink-subtle">
                Lupa kata sandi?
              </Link>
            </div>

            {errors.form && <p className="mb-4 text-small text-destructive">{errors.form}</p>}

            <SolidButton type="submit" disabled={processing} className="mb-6">
              Masuk
            </SolidButton>
          </>
        )}
      </Form>

      <div className="mb-6 flex items-center gap-3.5">
        <div className="h-px flex-1 bg-rule-strong" />
        <span className="text-eyebrow tracking-widest text-ink-subtle uppercase">atau</span>
        <div className="h-px flex-1 bg-rule-strong" />
      </div>

      <Link route="signup.create" className="mb-10 block">
        <OutlineButton render={<span />}>Daftar Akun</OutlineButton>
      </Link>
    </AuthLayout>
  )
}
