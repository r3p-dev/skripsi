import { PasswordInput } from '@/components/atoms/password_input'
import { PhoneInput } from '@/components/atoms/phone_input'
import {
  BackLink,
  Eyebrow,
  Lede,
  OutlineButton,
  PageTitle,
  UnderlineInput,
} from '@/components/atoms/editorial'
import { EditActions, ProfileRow, ReadOnlyRow } from '@/components/molecules/profile_row'
import CustomerLayout from '@/components/layouts/customer_layout'
import { Field, FieldError, FieldLabel } from '@/components/ui/field'
import type { Data } from '@/generated/data'
import type { InertiaProps } from '@/types'
import { Form, Link } from '@adonisjs/inertia/react'
import { useState } from 'react'

type PageProps = InertiaProps<{
  address: Data.Address | null
}>

type EditableField = 'name' | 'phone' | 'password'

export default function Show({ user, address }: PageProps) {
  const [editing, setEditing] = useState<EditableField | null>(null)

  if (!user) {
    return <p>Pengguna tidak ditemukan</p>
  }

  const close = () => setEditing(null)

  return (
    <CustomerLayout title="Profil" description="Kelola profil dan akun UmimaClean Anda">
      <header className="gutter pt-6">
        <BackLink route="home">← Kembali</BackLink>
      </header>

      <main className="flex-1 pb-nav">
        <div className="gutter pt-7 pb-2">
          <PageTitle className="mb-1.5">Profil Saya</PageTitle>
          <Lede>Kelola informasi akun Anda.</Lede>
        </div>

        <section className="gutter pt-6">
          <Eyebrow className="mb-2">Informasi Akun</Eyebrow>

          <ProfileRow label="Nama">
            {editing === 'name' ? (
              <Form route="customer.profile.update" onSuccess={close}>
                {({ errors, processing }) => (
                  <>
                    <Field className="mb-2">
                      <FieldLabel htmlFor="name" className="sr-only">
                        Nama
                      </FieldLabel>
                      <UnderlineInput
                        id="name"
                        name="name"
                        type="text"
                        autoComplete="name"
                        defaultValue={user.name}
                        autoFocus
                        aria-invalid={!!errors.name}
                        className="border-b-ink py-1.5"
                      />
                      <FieldError>{errors.name}</FieldError>
                    </Field>
                    <EditActions processing={processing} onCancel={close} />
                  </>
                )}
              </Form>
            ) : (
              <ReadOnlyRow value={user.name} label="Ubah nama" onEdit={() => setEditing('name')} />
            )}
          </ProfileRow>

          <ProfileRow label="No. HP">
            {editing === 'phone' ? (
              <Form route="customer.phone.store" onSuccess={close}>
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
              <Form route="customer.password.update" onSuccess={close}>
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

        <section className="gutter pt-8">
          <Eyebrow className="mb-4">Alamat</Eyebrow>
          <div className="flex items-center justify-between gap-3 border border-rule-strong px-5 py-[18px]">
            <div>
              <div className="mb-1 text-body leading-[1.4] font-semibold text-ink">
                Alamat Penjemputan
              </div>
              <div className="text-small leading-[1.5] text-ink-soft">
                {address?.street ?? 'Belum ada alamat'}
              </div>
            </div>
            <Link
              route="customer.address.show"
              aria-label="Kelola alamat penjemputan"
              className="ml-3 text-meta whitespace-nowrap text-ink-soft hover:text-ink"
            >
              Kelola →
            </Link>
          </div>
        </section>

        <section className="gutter pt-8">
          <Eyebrow className="mb-4">Pesanan</Eyebrow>
          <a
            href="/orders"
            className="flex items-center justify-between border border-rule-strong px-5 py-[18px] text-body leading-[1.4] text-ink"
          >
            Riwayat Pesanan<span className="text-ink-subtle">→</span>
          </a>
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
      </main>
    </CustomerLayout>
  )
}
