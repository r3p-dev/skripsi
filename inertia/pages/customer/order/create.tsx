import CustomerLayout from '@/components/layouts/customer_layout'
import { Button, buttonVariants } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Spinner } from '@/components/ui/spinner'
import type { InertiaProps } from '@/types'
import { Form, Link } from '@adonisjs/inertia/react'
import type { Data } from '@/generated/data'
import { IconAlertCircle } from '@tabler/icons-react'

type PageProps = InertiaProps<{
  address: Data.Address | null
}>

export default function CreateOrder(props: PageProps) {
  return (
    <CustomerLayout title="Buat Pesanan Baru" description="Pilih tanggal pickup sepatu Anda">
      <div className="flex-1 w-full max-w-md space-y-6 mx-auto p-4 pb-24">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-black mb-1">Buat Pesanan Baru</h2>
          <p className="text-gray-600">Pilih tanggal pickup sepatu Anda</p>
        </div>

        <Card className="bg-black text-white gap-2">
          <CardHeader>
            <CardTitle className="text-lg font-bold">Cara Pemesanan</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            <li className="flex gap-3">
              <span className="shrink-0">1.</span>
              <span>Pesan layanan</span>
            </li>
            <li className="flex gap-3">
              <span className="shrink-0">2.</span>
              <span>Kami akan jadwalkan otomatis waktu penjemputan sepatu Anda</span>
            </li>
            <li className="flex gap-3">
              <span className="shrink-0">3.</span>
              <span>Setelah sepatu dijemput, tim kami akan cek kondisi sepatu Anda di toko</span>
            </li>
            <li className="flex gap-3">
              <span className="shrink-0">4.</span>
              <span>Tim kami akan memilih layanan terbaik untuk sepatu Anda</span>
            </li>
            <li className="flex gap-3">
              <span className="shrink-0">5.</span>
              <span>Anda membayar sesuai dengan layanan yang telah dipilih</span>
            </li>
            <li className="flex gap-3">
              <span className="shrink-0">6.</span>
              <span>Tunggu proses cuci dan sepatu Anda akan kami antarkan kembali</span>
            </li>
          </CardContent>
        </Card>

        {!props.address && (
          <div className="border-2 border-gray-300 rounded-2xl p-5 space-y-4 bg-white">
            <div className="flex gap-3">
              <span className="text-2xl shrink-0">
                <IconAlertCircle />
              </span>
              <div>
                <h3 className="font-bold text-black">Alamat Belum Dibuat</h3>
                <p className="text-sm text-gray-600 mt-1">
                  Anda perlu menambahkan alamat terlebih dahulu untuk membuat pesanan
                </p>
              </div>
            </div>
            <Link
              route="customer.address.show"
              className={buttonVariants({
                className: 'w-full h-11 ',
              })}
            >
              Buat Alamat
            </Link>
          </div>
        )}

        <div>
          <Link
            route="session.create"
            className={buttonVariants({
              variant: 'outline',
              className:
                'w-full h-11 border-2 border-gray-300! font-semibold active:scale-95 transition-all',
            })}
          >
            Lihat Daftar Harga
          </Link>
        </div>
        <div>
          <Form
            route="customer.order.store"
            disableWhileProcessing
            resetOnSuccess
            transform={() => ({
              addressId: props.address?.id,
            })}
          >
            {({ processing }) => (
              <Button
                type="submit"
                disabled={!props.address || processing}
                className="w-full font-semibold h-11 text-base disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {processing ? <Spinner /> : 'Buat Pesanan'}
              </Button>
            )}
          </Form>
        </div>
      </div>
    </CustomerLayout>
  )
}
