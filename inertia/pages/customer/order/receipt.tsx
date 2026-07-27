import { buttonVariants } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import type { Data } from '@/generated/data'
import type { InertiaProps } from '@/types'
import { Link } from '@adonisjs/inertia/react'
import { Head } from '@inertiajs/react'
import { IconArrowLeft, IconPrinter } from '@tabler/icons-react'

type PageProps = InertiaProps<{
  order: Data.Order
}>

export default function Receipt({ order }: PageProps) {
  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col bg-white">
      <Head>
        <title>{`Struk ${order.orderNumber}`}</title>
        <meta name="description" content="Struk pesanan UmimaClean Anda" />
      </Head>

      <div className="flex items-center gap-3 px-6 py-5 print:hidden">
        <Link
          route="customer.order.show"
          routeParams={{ number: order.orderNumber }}
          className="flex size-9 items-center justify-center rounded-full border border-gray-300 text-black transition-colors hover:bg-gray-100 active:scale-95"
        >
          <IconArrowLeft className="size-5" />
        </Link>
        <div>
          <p className="text-xs tracking-[0.3em] text-gray-600 uppercase font-medium">Pesanan</p>
          <h1 className="text-2xl font-bold tracking-tight text-black">Struk Pesanan</h1>
        </div>
      </div>

      <div className="flex-1 px-6 pb-10">
        <Card className="gap-0 rounded-2xl border border-gray-200 p-0">
          <div className="relative bg-black px-6 py-8 text-center text-white">
            <div
              className="absolute inset-0 opacity-5"
              style={{
                backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)',
                backgroundSize: '32px 32px',
              }}
            />
            <div className="relative space-y-1">
              <img src="/images/logo.jpg" alt="UmimaClean" className="mx-auto size-12" />
              <h2 className="text-xl font-bold tracking-tight">UmimaClean</h2>
              <p className="text-xs tracking-widest text-white/70 uppercase">Layanan Cuci Sepatu</p>
            </div>
          </div>

          <div className="space-y-4 border-b border-dashed border-gray-300 p-6">
            <div className="text-center">
              <p className="text-xs tracking-widest text-gray-500 uppercase">Nomor Pesanan</p>
              <p className="text-lg font-bold tracking-tight text-black">{order.orderNumber}</p>
            </div>

            <div className="flex flex-col gap-2 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Status</span>
                <span className="font-semibold text-black">{order.status}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Tanggal Pemesanan</span>
                <span className="font-semibold text-black">{order.createdAt}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Tanggal Penjemputan</span>
                <span className="font-semibold text-black">{order.pickupDate ?? '-'}</span>
              </div>
            </div>
          </div>

          <div className="space-y-2 border-b border-dashed border-gray-300 p-6 text-sm">
            <p className="text-xs tracking-widest text-gray-500 uppercase">Penerima</p>
            <p className="font-medium text-black">{order.customerName}</p>
            <p className="text-gray-600">{order.customerPhone}</p>
            {order.address && (
              <p className="leading-relaxed text-gray-700">{order.address.street}</p>
            )}
          </div>

          <div className="flex items-center justify-between p-6">
            <span className="text-sm tracking-widest text-gray-600 uppercase font-medium">
              Total
            </span>
            <span className="text-xl font-bold tracking-tight text-black">
              {order.totalPrice ?? 'Belum ada tagihan'}
            </span>
          </div>
        </Card>

        <p className="mt-6 text-center text-xs leading-relaxed text-gray-500">
          Terima kasih telah menggunakan layanan UmimaClean
        </p>

        <button
          type="button"
          onClick={() => window.print()}
          className={buttonVariants({
            variant: 'outline',
            className:
              'mt-6 h-12 w-full rounded-xl text-base font-semibold tracking-wide text-black active:scale-95 print:hidden',
          })}
        >
          <IconPrinter className="size-5" />
          Cetak Struk
        </button>
      </div>
    </div>
  )
}
