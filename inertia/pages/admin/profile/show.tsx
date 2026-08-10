import AdminLayout from '@/components/layouts/admin_layout'
import { PasswordInput } from '@/components/atoms/password_input'
import { PhoneInput } from '@/components/atoms/phone_input'
import { Eyebrow, OutlineButton } from '@/components/atoms/editorial'
import { PageHeader } from '@/components/molecules/page_header'
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
    <AdminLayout title="Profil" description="Kelola akun admin UmimaClean">
      <PageHeader eyebrow="Akun" title="Profil Saya" description="Kelola informasi akun Anda." />

      <div className="max-w-3xl">
        <section className="mb-8">
          <Eyebrow className="mb-2">Informasi Akun</Eyebrow>

          <ProfileRow label="Nama">
            <span className="text-lead leading-[1.4] text-ink">{user.name}</span>
          </ProfileRow>

          <ProfileRow label="No. HP">
            {editing === 'phone' ? (
              <Form route="admin.phone.store" onSuccess={close}>
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
                        defaultValue={user.phone}
                        autoFocus
                        aria-invalid={!!errors.phone}
                        className="underline-field h-auto border-b-ink py-1.5 focus-visible:border-ink focus-visible:ring-0"
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
              <Form route="admin.profile.update" onSuccess={close}>
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
                        className="underline-field h-auto focus-visible:border-ink focus-visible:ring-0"
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
                        className="underline-field h-auto focus-visible:border-ink focus-visible:ring-0"
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
                        className="underline-field h-auto focus-visible:border-ink focus-visible:ring-0"
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

        <Form route="session.destroy">
          {({ processing }) => (
            <OutlineButton type="submit" disabled={processing} className="max-w-xs">
              Keluar
            </OutlineButton>
          )}
        </Form>
      </div>
    </AdminLayout>
  )
}
