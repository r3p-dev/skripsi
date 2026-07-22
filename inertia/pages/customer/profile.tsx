import { PasswordInput } from '@/components/atoms/password_input'
import CustomerProfileLayout from '@/components/layouts/customer_profile_layout'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Field, FieldError, FieldGroup, FieldLabel, FieldSet } from '@/components/ui/field'
import { Spinner } from '@/components/ui/spinner'
import type { InertiaProps } from '@/types'
import { Form, Link } from '@adonisjs/inertia/react'
import {
  IconCalendar,
  IconLock,
  IconLogout,
  IconPackage,
  IconPhone,
  IconUser,
} from '@tabler/icons-react'
import { useState } from 'react'

type PageProps = InertiaProps<{
  totalOrders: string
}>

export default function Profile(props: PageProps) {
  const [isOpen, setIsOpen] = useState<boolean>(false)

  return (
    <CustomerProfileLayout title="Profil" description="Kelola informasi profil dan alamat Anda">
      <div className="space-y-4">
        <Card className="border border-gray-200 bg-gray-50 overflow-hidden">
          <CardHeader className="pb-0 bg-white border-b border-gray-200">
            <div className="flex items-center gap-3">
              <div className="flex size-12 items-center justify-center rounded-lg bg-black">
                <IconUser className="size-6 text-white" />
              </div>
              <h3 className="text-base font-bold text-black">{props.user?.name}</h3>
            </div>
          </CardHeader>

          <CardContent className="space-y-5">
            <div className="flex items-start gap-4">
              <div className="flex size-10 items-center justify-center bg-gray-200 rounded-lg shrink-0 hover:bg-gray-300 transition-colors">
                <IconPhone className="size-5 text-black" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-gray-600 font-semibold uppercase tracking-wider mb-1">
                  Nomor Telepon
                </p>
                <p className="font-medium text-black text-sm break-all">{props.user?.phone}</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="flex size-10 items-center justify-center bg-gray-200 rounded-lg shrink-0 hover:bg-gray-300 transition-colors">
                <IconCalendar className="size-5 text-black" />
              </div>
              <div className="flex-1">
                <p className="text-xs text-gray-600 font-semibold uppercase tracking-wider mb-1">
                  Member Sejak
                </p>
                <p className="font-medium text-black text-sm">{props.user?.createdAt}</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="flex size-10 items-center justify-center bg-gray-200 rounded-lg shrink-0 hover:bg-gray-300 transition-colors">
                <IconPackage className="size-5 text-black" />
              </div>
              <div className="flex-1">
                <p className="text-xs text-gray-600 font-semibold uppercase tracking-wider mb-1">
                  Total Pesanan
                </p>
                <p className="font-medium text-black text-sm">{props.totalOrders} pesanan</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger className="w-full h-11 border-2 rounded-lg border-gray-300 bg-white text-black font-semibold hover:bg-gray-50 active:scale-95 transition-all flex items-center justify-center gap-2">
            <IconLock className="size-5" />
            Ubah Kata Sandi
          </DialogTrigger>

          <DialogContent className="w-[calc(100%-3rem)] border border-gray-300 bg-white">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold text-black">Ubah Kata Sandi</DialogTitle>
              <DialogDescription className="text-sm text-gray-700">
                Masukkan kata sandi lama dan kata sandi baru Anda
              </DialogDescription>
            </DialogHeader>

            <Form route="customer.profile.update" disableWhileProcessing resetOnSuccess>
              {({ errors, processing }) => (
                <FieldSet>
                  <FieldGroup>
                    <Field data-invalid={errors.current_password ? 'true' : undefined}>
                      <FieldLabel className="text-sm">Kata Sandi Lama</FieldLabel>
                      <PasswordInput
                        className="h-10 px-3 py-1"
                        name="current_password"
                        placeholder="Masukkan kata sandi"
                      />
                      <FieldError
                        errors={
                          errors.current_password
                            ? [{ message: errors.current_password }]
                            : undefined
                        }
                      />
                    </Field>

                    <Field data-invalid={errors.password ? 'true' : undefined}>
                      <FieldLabel className="text-sm">Kata Sandi Baru</FieldLabel>
                      <PasswordInput
                        className="h-10 px-3 py-1"
                        name="password"
                        placeholder="Masukkan kata sandi"
                      />
                      <FieldError
                        errors={errors.password ? [{ message: errors.password }] : undefined}
                      />
                    </Field>

                    <Field data-invalid={errors.password_confirmation ? 'true' : undefined}>
                      <FieldLabel className="text-sm">Konfirmasi Kata Sandi Baru</FieldLabel>
                      <PasswordInput
                        className="h-10 px-3 py-1"
                        name="password_confirmation"
                        placeholder="Masukkan konfirmasi kata sandi"
                      />
                      <FieldError
                        errors={
                          errors.password_confirmation
                            ? [{ message: errors.password_confirmation }]
                            : undefined
                        }
                      />
                    </Field>

                    <Field orientation="horizontal" className="mt-2">
                      <Button
                        onClick={() => setIsOpen(false)}
                        variant="outline"
                        className="flex-1 h-11 rounded-lg border border-gray-300 text-black font-semibold hover:bg-gray-50 text-sm active:scale-95 transition-all"
                      >
                        Batalkan
                      </Button>
                      <Button
                        type="submit"
                        onClick={() => setIsOpen(false)}
                        className="flex-1 h-11 rounded-lg bg-black text-white font-semibold hover:bg-gray-900 disabled:opacity-60 disabled:cursor-not-allowed active:scale-95 text-sm transition-all"
                      >
                        {processing ? <Spinner /> : 'Simpan'}
                      </Button>
                    </Field>
                  </FieldGroup>
                </FieldSet>
              )}
            </Form>
          </DialogContent>
        </Dialog>

        <Link
          route="session.destroy"
          className="w-full h-11 rounded-lg border-2 border-gray-300 bg-red-50 text-red-600 font-semibold hover:bg-red-100 active:scale-95 transition-all flex items-center justify-center gap-2"
        >
          <IconLogout className="size-5" />
          Keluar dari Akun
        </Link>
      </div>
    </CustomerProfileLayout>
  )
}
