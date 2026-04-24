import UserLayout from '@/components/layouts/user-layout'
import StaticMap from '@/components/organisms/static-map'
import { Button, buttonVariants } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { InertiaProps } from '@/types'
import { Link } from '@adonisjs/inertia/react'
import { Data } from '@generated/data'
import { IconEdit, IconMapPin, IconPhone, IconPlus, IconUser } from '@tabler/icons-react'

type PageProps = InertiaProps<{
  address: Data.Address | null
}>

export default function ShowAddress(props: PageProps) {
  return (
    <UserLayout>
      <div className="w-full max-w-md mx-auto p-4 pb-20">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-black mb-1">Profil & Alamat</h2>
          <p className="text-gray-600">Kelola informasi profil dan alamat Anda</p>
        </div>

        <div className="flex gap-3 mb-6">
          <Link
            route="profile.show"
            className={buttonVariants({
              variant: 'outline',
              className:
                'flex-1 h-8 text-sm font-semibold transition-all bg-gray-100 text-black hover:bg-gray-200',
              size: 'lg',
            })}
          >
            Akun
          </Link>
          <Button
            className="flex-1 h-8 text-sm font-semibold transition-all bg-black text-white shadow-sm"
            size="lg"
          >
            Alamat
          </Button>
        </div>

        {props.address ? (
          <div className="space-y-4">
            <Card className="border border-gray-200 bg-gray-50 overflow-hidden">
              <CardHeader className="bg-white border-b border-gray-200">
                <h3 className="text-lg font-bold text-black mb-1">Alamat Anda</h3>
                <p className="text-sm text-gray-600">
                  Informasi alamat pengiriman yang akan digunakan untuk layanan antar jemput
                </p>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="flex items-start gap-4">
                  <div className="flex size-10 items-center justify-center bg-gray-200 rounded-lg shrink-0 hover:bg-gray-300 transition-colors">
                    <IconUser className="size-5 text-black" />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs text-gray-600 font-semibold uppercase tracking-wider mb-1">
                      Nama Penerima
                    </p>
                    <p className="font-medium text-black text-sm">{props.address.name}</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="flex size-10 items-center justify-center bg-gray-200 rounded-lg shrink-0 hover:bg-gray-300 transition-colors">
                    <IconPhone className="size-5 text-black" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-gray-600 font-semibold uppercase tracking-wider mb-1">
                      Nomor Telepon
                    </p>
                    <p className="font-medium text-black text-sm break-all">
                      {props.address.phone}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="flex size-10 items-center justify-center bg-gray-200 rounded-lg shrink-0 hover:bg-gray-300 transition-colors">
                    <IconMapPin className="size-5 text-black" />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs text-gray-600 font-semibold uppercase tracking-wider mb-1">
                      Alamat Lengkap
                    </p>
                    <p className="font-medium text-black text-sm">{props.address.street}</p>
                  </div>
                </div>

                <div className="mt-6">
                  <p className="text-xs text-gray-600 font-semibold uppercase tracking-wider mb-3">
                    Lokasi
                  </p>
                  <div className="overflow-hidden rounded-lg border border-border">
                    <StaticMap
                      latitude={props.address.latitude}
                      longitude={props.address.longitude}
                    />
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="flex size-10 items-center justify-center bg-gray-200 rounded-lg shrink-0 hover:bg-gray-300 transition-colors">
                    <IconUser className="size-5 text-black" />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs text-gray-600 font-semibold uppercase tracking-wider mb-1">
                      Catatan
                    </p>
                    <p className="font-medium text-black text-sm">
                      {props.address.note ? props.address.note : 'Tidak ada catatan tambahan'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Link route="address.create">
              <Button
                variant="outline"
                className="w-full h-12 border-2 border-gray-300 bg-white text-black font-semibold hover:bg-gray-50 active:scale-95 transition-all flex items-center justify-center gap-2 text-sm"
              >
                <IconEdit className="size-5" />
                Edit Alamat
              </Button>
            </Link>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center min-h-100 text-center">
            <div className="size-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
              <IconMapPin className="size-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-bold text-black mb-2">Belum ada alamat</h3>
            <p className="text-sm text-gray-600 mb-6 px-4">
              Tambahkan alamat pengiriman Anda untuk memudahkan proses layanan
            </p>
            <Link route="address.create">
              <Button className="bg-black text-white hover:bg-gray-900 font-semibold rounded-lg px-6 h-11 flex items-center gap-2 text-sm">
                <IconPlus className="size-5" />
                Tambah Alamat
              </Button>
            </Link>
          </div>
        )}
      </div>
    </UserLayout>
  )
}
