import { buttonVariants } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import StaticMap from '@/components/organisms/static_map'
import type { Data } from '@/generated/data'
import type { InertiaProps } from '@/types'
import { Link } from '@adonisjs/inertia/react'
import { IconArrowLeft, IconMapPin, IconPencil, IconPhone, IconUser } from '@tabler/icons-react'
import CustomerLayout from '@/components/layouts/customer_layout'

type PageProps = InertiaProps<{
  address: Data.Address | null
}>

export default function Show({ address }: PageProps) {
  return (
    <CustomerLayout title="Alamat" description="Alamat penjemputan UmimaClean Anda">
      <div className="flex items-center gap-3 px-6 py-5">
        <Link
          route="customer.profile.show"
          className="flex size-9 items-center justify-center rounded-full border border-gray-300 text-black transition-colors hover:bg-gray-100 active:scale-95"
        >
          <IconArrowLeft className="size-5" />
        </Link>
        <div>
          <p className="text-xs tracking-[0.3em] text-gray-600 uppercase font-medium">Alamat</p>
          <h1 className="text-2xl font-bold tracking-tight text-black">Alamat Saya</h1>
        </div>
      </div>

      <div className="flex-1 px-6 pb-28">
        {address ? (
          <div className="space-y-4">
            <div className="overflow-hidden rounded-2xl border border-gray-200">
              <StaticMap latitude={address.latitude} longitude={address.longitude} />
            </div>

            <Card className="rounded-2xl border border-gray-200 bg-gray-50 p-5">
              <div className="flex items-center gap-3">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-black/10">
                  <IconUser className="size-5 text-black" />
                </div>
                <div>
                  <p className="text-xs tracking-widest text-gray-500 uppercase">Nama Penerima</p>
                  <p className="text-base font-medium text-black">{address.name}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-black/10">
                  <IconPhone className="size-5 text-black" />
                </div>
                <div>
                  <p className="text-xs tracking-widest text-gray-500 uppercase">Nomor Telepon</p>
                  <p className="text-base font-medium text-black">{address.phone}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-black/10">
                  <IconMapPin className="size-5 text-black" />
                </div>
                <div>
                  <p className="text-xs tracking-widest text-gray-500 uppercase">Alamat Lengkap</p>
                  <p className="text-base font-medium text-black">{address.street}</p>
                  {address.note && <p className="mt-1 text-sm text-gray-600">{address.note}</p>}
                </div>
              </div>
            </Card>

            <Link
              route="customer.address.create"
              className={buttonVariants({
                className:
                  'h-12 w-full rounded-xl bg-black text-base font-semibold tracking-wide text-white transition-all duration-300 hover:bg-black/90 active:scale-95',
              })}
            >
              <IconPencil className="size-5" />
              Ubah Alamat
            </Link>
          </div>
        ) : (
          <Card className="flex flex-col items-center gap-4 rounded-2xl border border-dashed border-gray-300 bg-gray-50 px-6 py-16 text-center">
            <div className="flex size-14 items-center justify-center rounded-full bg-black/10">
              <IconMapPin className="size-7 text-black" />
            </div>
            <div className="space-y-1">
              <p className="text-base font-semibold text-black">Alamat tidak ditemukan</p>
              <p className="text-sm text-gray-600">
                Tambahkan alamat penjemputan untuk mulai memesan
              </p>
            </div>
            <Link
              route="customer.address.create"
              className={buttonVariants({
                className:
                  'h-11 rounded-xl bg-black px-6 text-sm font-semibold tracking-wide text-white hover:bg-black/90 active:scale-95',
              })}
            >
              Tambah Alamat
            </Link>
          </Card>
        )}
      </div>
    </CustomerLayout>
  )
}
