import { PasswordInput } from '@/components/atoms/password_input'
import { PhoneInput } from '@/components/atoms/phone_input'
import CustomerLayout from '@/components/layouts/customer_layout'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Field, FieldError, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import type { Data } from '@/generated/data'
import type { InertiaProps } from '@/types'
import { Form, Link } from '@adonisjs/inertia/react'
import { IconChevronRight, IconLogout, IconPencil } from '@tabler/icons-react'
import { useState } from 'react'

type PageProps = InertiaProps<{
  totalOrders: number
  address: Data.Address | null
}>

export default function Show({ user, totalOrders, address }: PageProps) {
  const [editingField, setEditingField] = useState<'name' | 'phone' | 'password' | null>(null)

  if (!user) {
    return <p>Pengguna tidak ditemukan</p>
  }

  return (
    <CustomerLayout title="Profil" description="Kelola profil dan akun UmimaClean Anda">
      <div className="px-6 py-5">
        <p className="text-xs tracking-[0.3em] text-gray-600 uppercase font-medium">Akun</p>
        <h1 className="text-3xl font-bold tracking-tight text-black">Profil Saya</h1>
      </div>

      <div className="flex-1 space-y-4 px-6 pb-nav">
        <Card className="rounded-2xl border border-gray-200 bg-gray-50">
          <CardHeader>
            <p className="text-xs tracking-widest text-gray-600 uppercase font-medium">
              Informasi Akun
            </p>
          </CardHeader>

          <CardContent className="flex flex-col divide-y divide-gray-200">
            <div className="py-4">
              {editingField === 'name' ? (
                <Form
                  route="customer.profile.update"
                  onSuccess={() => setEditingField(null)}
                  className="space-y-3"
                >
                  {({ errors, processing }) => (
                    <>
                      <Field data-invalid={errors.name ? 'true' : undefined}>
                        <FieldLabel
                          htmlFor="name"
                          className="text-xs tracking-widest text-gray-700 uppercase"
                        >
                          Nama
                        </FieldLabel>
                        <Input
                          id="name"
                          name="name"
                          type="text"
                          autoComplete="name"
                          defaultValue={user.name}
                          autoFocus
                          aria-invalid={!!errors.name}
                          className="h-11 rounded-xl border-gray-300 bg-white px-4 focus-visible:border-black focus-visible:ring-black/10"
                        />
                        <FieldError>{errors.name}</FieldError>
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
                    <p className="text-xs tracking-widest text-gray-500 uppercase">Nama</p>
                    <p className="mt-1 text-base font-medium text-black">{user.name}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setEditingField('name')}
                    aria-label="Ubah nama"
                    className="flex size-11 shrink-0 items-center justify-center rounded-full text-gray-400 transition-colors hover:bg-gray-100 hover:text-black active:scale-95"
                  >
                    <IconPencil size={18} />
                  </button>
                </div>
              )}
            </div>

            <div className="py-4">
              {editingField === 'phone' ? (
                <Form
                  route="customer.phone.store"
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

            <Link
              route="customer.address.show"
              className="flex items-center justify-between gap-3 py-4"
            >
              <div>
                <p className="text-xs tracking-widest text-gray-500 uppercase">Alamat</p>
                <p className="mt-1 text-base font-medium text-black">
                  {address?.street ?? 'Belum ada alamat'}
                </p>
              </div>
              <IconChevronRight size={18} className="shrink-0 text-gray-400" />
            </Link>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border border-gray-200 bg-gray-50">
          <CardHeader>
            <p className="text-xs tracking-widest text-gray-600 uppercase font-medium">Statistik</p>
          </CardHeader>
          <CardContent className="flex flex-col divide-y divide-gray-200">
            <div className="flex items-center justify-between py-4">
              <p className="text-sm text-gray-600">Total Pesanan</p>
              <p className="text-base font-semibold text-black">{totalOrders}</p>
            </div>
            <div className="flex items-center justify-between py-4">
              <p className="text-sm text-gray-600">Member Sejak</p>
              <p className="text-base font-semibold text-black">{user.createdAt}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border border-gray-200 bg-gray-50">
          <CardHeader>
            <p className="text-xs tracking-widest text-gray-600 uppercase font-medium">Keamanan</p>
          </CardHeader>
          <CardContent className="py-4">
            {editingField === 'password' ? (
              <Form
                route="customer.password.update"
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

                    {errors.form && <p className="text-sm text-destructive">{errors.form}</p>}

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
    </CustomerLayout>
  )
}
