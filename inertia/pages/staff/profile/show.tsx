import { cn } from '@/lib/utils'
import { PasswordInput } from '@/components/atoms/password_input'
import { PhoneInput } from '@/components/atoms/phone_input'
import {
  BackLink,
  Eyebrow,
  Lede,
  OutlineButton,
  PageTitle,
  underlineField,
} from '@/components/atoms/editorial'
import StaffLayout from '@/components/layouts/staff_layout'
import { EditActions, ProfileRow, ReadOnlyRow } from '@/components/molecules/profile_row'
import { Field, FieldError, FieldLabel } from '@/components/ui/field'
import type { InertiaProps } from '@/types'
import { Form } from '@adonisjs/inertia/react'
import { useState } from 'react'

type PageProps = InertiaProps

type EditableField = 'phone' | 'password'

export default function Show({ user }: PageProps) {
  const [editing, setEditing] = useState<EditableField | null>(null)

  if (!user) {
    return <p>Pengguna tidak ditemukan</p>
  }

  const close = () => setEditing(null)

  return (
    <StaffLayout title="Profil" description="Kelola akun petugas UmimaClean">
      <header className="gutter pt-6">
        <BackLink route="home">← Kembali</BackLink>
      </header>

      <div className="flex-1 pb-nav">
        <div className="gutter pt-7 pb-2">
          <PageTitle className="mb-1.5">Profil Saya</PageTitle>
          <Lede>Kelola informasi akun Anda.</Lede>
        </div>

        <section className="gutter pt-6">
          <Eyebrow className="mb-2">Informasi Akun</Eyebrow>

          <ProfileRow label="Nama">
            <span className="text-lead leading-[1.4] text-ink">{user.name}</span>
          </ProfileRow>

          <ProfileRow label="No. HP">
            {editing === 'phone' ? (
              <Form route="staff.phone.store" onSuccess={close}>
                {({ errors, processing }) => (
                  <>
                    <Field className="mb-2">
                      <FieldLabel htmlFor="phone" className="sr-only">
                        Nomor Telepon
                      </FieldLabel>
                      <PhoneInput
                        id="phone"
                        name="phone"
                        autoComplete="tel"
                        key={user.phone}
                        defaultValue={user.phone}
                        autoFocus
                        aria-invalid={!!errors.phone}
                        className={cn(underlineField, 'border-b-ink py-1.5')}
                      />
                      <FieldError>{errors.phone}</FieldError>
                      <p className="text-meta text-ink-subtle">
                        Tautan verifikasi akan dikirim melalui WhatsApp ke nomor baru.
                      </p>
                    </Field>
                    <EditActions processing={processing} onCancel={close} />
                  </>
                )}
              </Form>
            ) : (
              <ReadOnlyRow
                value={user.phone}
                label="Ubah nomor HP"
                onEdit={() => setEditing('phone')}
              />
            )}
          </ProfileRow>

          <ProfileRow label="Kata Sandi">
            {editing === 'password' ? (
              <Form route="staff.profile.update" onSuccess={close}>
                {({ errors, processing }) => (
                  <>
                    <Field className="mb-3">
                      <FieldLabel htmlFor="currentPassword" className="field-label mb-2">
                        Kata Sandi Saat Ini
                      </FieldLabel>
                      <PasswordInput
                        id="currentPassword"
                        name="currentPassword"
                        autoComplete="current-password"
                        autoFocus
                        aria-invalid={!!errors.currentPassword}
                        className={underlineField}
                      />
                      <FieldError>{errors.currentPassword}</FieldError>
                    </Field>

                    <Field className="mb-3">
                      <FieldLabel htmlFor="password" className="field-label mb-2">
                        Kata Sandi Baru
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

                    <Field className="mb-3">
                      <FieldLabel htmlFor="passwordConfirmation" className="field-label mb-2">
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

                    {errors.form && (
                      <p className="mb-3 text-small text-destructive">{errors.form}</p>
                    )}

                    <EditActions processing={processing} onCancel={close} />
                  </>
                )}
              </Form>
            ) : (
              <ReadOnlyRow
                value="••••••••"
                label="Ubah kata sandi"
                onEdit={() => setEditing('password')}
              />
            )}
          </ProfileRow>
        </section>

        <div className="gutter pt-10 pb-12">
          <Form route="session.destroy">
            {({ processing }) => (
              <OutlineButton type="submit" disabled={processing}>
                Keluar
              </OutlineButton>
            )}
          </Form>
        </div>
      </div>
    </StaffLayout>
  )
}
