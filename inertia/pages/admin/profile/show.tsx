import AdminLayout from '@/components/layouts/admin_layout'
import { PasswordInput } from '@/components/atoms/password_input'
import { PhoneInput } from '@/components/atoms/phone_input'
import { PageHeader } from '@/components/molecules/page_header'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Field, FieldError, FieldLabel } from '@/components/ui/field'
import type { InertiaProps } from '@/types'
import { Form } from '@adonisjs/inertia/react'
import { IconLogout, IconPencil } from '@tabler/icons-react'
import { useState } from 'react'

type PageProps = InertiaProps<{
  teamSize: number
  transactions: number
}>

/**
 * Which row is currently showing a form instead of its read-only view. Only
 * one may be open at a time, matching the customer and staff profiles.
 */
type EditableField = 'phone' | 'password'

export default function Show({ user, teamSize, transactions }: PageProps) {
  const [editingField, setEditingField] = useState<EditableField | null>(null)

  if (!user) {
    return <p>Pengguna tidak ditemukan</p>
  }

  return (
    <AdminLayout title="Profil" description="Kelola akun admin UmimaClean">
      <PageHeader eyebrow="Akun" title="Profil Saya" />

      <div className="grid max-w-3xl gap-4">
        <Card className="rounded-2xl border border-gray-200 bg-gray-50">
          <CardHeader>
            <p className="text-xs font-medium tracking-widest text-gray-600 uppercase">
              Informasi Akun
            </p>
          </CardHeader>

          <CardContent className="flex flex-col divide-y divide-gray-200">
            {/*
              An admin's name is attributed on every payment override they
              record, so it is fixed the same way a staff member's is.
            */}
            <div className="py-4">
              <p className="text-xs tracking-widest text-gray-500 uppercase">Nama</p>
              <p className="mt-1 text-base font-medium text-black">{user.name}</p>
            </div>

            <div className="py-4">
              {editingField === 'phone' ? (
                <Form
                  route="admin.phone.store"
                  onSuccess={() => setEditingField(null)}
                  className="space-y-3"
                >
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
                          defaultValue={user.phone}
                          autoFocus
                          aria-invalid={!!errors.phone}
                          className="h-11 rounded-xl border-gray-300 bg-white px-4 focus-visible:border-black focus-visible:ring-black/10"
                        />
                        <FieldError>{errors.phone}</FieldError>
                        <p className="text-xs text-gray-500">
                          Tautan verifikasi akan dikirim melalui WhatsApp ke nomor baru.
                        </p>
                      </Field>
                      <div className="flex justify-end gap-2">
                        <Button
                          type="button"
                          variant="ghost"
                          onClick={() => setEditingField(null)}
                          className="h-11 rounded-lg px-4 text-gray-600 hover:bg-gray-100"
                        >
                          Batal
                        </Button>
                        <Button
                          type="submit"
                          disabled={processing}
                          className="h-11 rounded-lg px-5 bg-black text-white hover:bg-black/90"
                        >
                          Kirim
                        </Button>
                      </div>
                    </>
                  )}
                </Form>
              ) : (
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs tracking-widest text-gray-500 uppercase">Nomor Telepon</p>
                    <p className="mt-1 text-base font-medium text-black">{user.phone}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setEditingField('phone')}
                    aria-label="Ubah nomor telepon"
                    className="flex size-11 shrink-0 items-center justify-center rounded-full text-gray-400 transition-colors hover:bg-gray-100 hover:text-black active:scale-95"
                  >
                    <IconPencil size={18} />
                  </button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border border-gray-200 bg-gray-50">
          <CardHeader>
            <p className="text-xs font-medium tracking-widest text-gray-600 uppercase">Statistik</p>
          </CardHeader>
          <CardContent className="flex flex-col divide-y divide-gray-200">
            <div className="flex items-center justify-between py-4">
              <p className="text-sm text-gray-600">Jumlah Petugas</p>
              <p className="text-base font-semibold text-black">{teamSize}</p>
            </div>
            <div className="flex items-center justify-between py-4">
              <p className="text-sm text-gray-600">Transaksi Terbayar</p>
              <p className="text-base font-semibold text-black">{transactions}</p>
            </div>
            <div className="flex items-center justify-between py-4">
              <p className="text-sm text-gray-600">Bergabung Sejak</p>
              <p className="text-base font-semibold text-black">{user.createdAt}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border border-gray-200 bg-gray-50">
          <CardHeader>
            <p className="text-xs font-medium tracking-widest text-gray-600 uppercase">Keamanan</p>
          </CardHeader>
          <CardContent className="py-4">
            {editingField === 'password' ? (
              <Form
                route="admin.profile.update"
                onSuccess={() => setEditingField(null)}
                className="space-y-3"
              >
                {({ errors, processing }) => (
                  <>
                    <Field data-invalid={errors.currentPassword ? 'true' : undefined}>
                      <FieldLabel
                        htmlFor="currentPassword"
                        className="text-xs tracking-widest text-gray-700 uppercase"
                      >
                        Kata Sandi Saat Ini
                      </FieldLabel>
                      <PasswordInput
                        id="currentPassword"
                        name="currentPassword"
                        autoComplete="current-password"
                        autoFocus
                        aria-invalid={!!errors.currentPassword}
                        className="h-11 rounded-xl border-gray-300 bg-white px-4 focus-visible:border-black focus-visible:ring-black/10"
                      />
                      <FieldError>{errors.currentPassword}</FieldError>
                    </Field>

                    <Field data-invalid={errors.password ? 'true' : undefined}>
                      <FieldLabel
                        htmlFor="password"
                        className="text-xs tracking-widest text-gray-700 uppercase"
                      >
                        Kata Sandi Baru
                      </FieldLabel>
                      <PasswordInput
                        id="password"
                        name="password"
                        autoComplete="new-password"
                        aria-invalid={!!errors.password}
                        className="h-11 rounded-xl border-gray-300 bg-white px-4 focus-visible:border-black focus-visible:ring-black/10"
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
                        className="h-11 rounded-xl border-gray-300 bg-white px-4 focus-visible:border-black focus-visible:ring-black/10"
                      />
                      <FieldError>{errors.passwordConfirmation}</FieldError>
                    </Field>

                    <div className="flex justify-end gap-2">
                      <Button
                        type="button"
                        variant="ghost"
                        onClick={() => setEditingField(null)}
                        className="h-11 rounded-lg px-4 text-gray-600 hover:bg-gray-100"
                      >
                        Batal
                      </Button>
                      <Button
                        type="submit"
                        disabled={processing}
                        className="h-11 rounded-lg px-5 bg-black text-white hover:bg-black/90"
                      >
                        Simpan
                      </Button>
                    </div>
                  </>
                )}
              </Form>
            ) : (
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs tracking-widest text-gray-500 uppercase">Kata Sandi</p>
                  <p className="mt-1 text-base font-medium text-black">••••••••••</p>
                </div>
                <button
                  type="button"
                  onClick={() => setEditingField('password')}
                  aria-label="Ubah kata sandi"
                  className="flex size-11 shrink-0 items-center justify-center rounded-full text-gray-400 transition-colors hover:bg-gray-100 hover:text-black active:scale-95"
                >
                  <IconPencil size={18} />
                </button>
              </div>
            )}
          </CardContent>
        </Card>

        <Form route="session.destroy">
          <Button
            type="submit"
            variant="outline"
            className="h-12 w-full rounded-2xl border-gray-200 text-base font-semibold text-destructive hover:bg-red-50 active:scale-95"
          >
            <IconLogout className="size-5" />
            Keluar
          </Button>
        </Form>
      </div>
    </AdminLayout>
  )
}
