import CustomerLayout from '@/components/layouts/customer_layout'
import { Badge } from '@/components/ui/badge'
import { buttonVariants } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import type { Data } from '@/generated/data'
import type { Filters, InertiaProps, Metadata } from '@/types'
import { Form, Link } from '@adonisjs/inertia/react'
import { IconChevronLeft, IconChevronRight, IconPlus, IconSearch } from '@tabler/icons-react'

type PageProps = InertiaProps<{
  orders: { data: Data.Order[]; metadata: Metadata }
  filters: Filters
}>

/**
 * Badge colour per order status. Keyed by the translated status the
 * transformer sends, so it must stay in sync with `OrderStatusLabel`.
 */
const STATUS_STYLES: Record<string, string> = {
  'Penjemputan Dijadwalkan': 'bg-gray-200 text-gray-700',
  'Dalam Penjemputan': 'bg-blue-100 text-blue-700',
  'Dalam Inspeksi': 'bg-blue-100 text-blue-700',
  'Menunggu Pelunasan': 'bg-amber-100 text-amber-700',
  'Dalam Pencucian': 'bg-blue-100 text-blue-700',
  'Dalam Pengantaran': 'bg-blue-100 text-blue-700',
  'Selesai': 'bg-green-100 text-green-700',
  'Dibatalkan': 'bg-red-100 text-red-700',
}

export default function Index({ orders, filters }: PageProps) {
  return (
    <CustomerLayout title="Pesanan" description="Riwayat pesanan UmimaClean Anda">
      <div className="flex items-center justify-between gap-3 px-6 py-5">
        <div>
          <p className="text-xs tracking-[0.3em] text-gray-600 uppercase font-medium">Pesanan</p>
          <h1 className="text-3xl font-bold tracking-tight text-black">Riwayat Pesanan</h1>
        </div>

        <Link
          route="customer.order.create"
          aria-label="Buat pesanan baru"
          className="flex size-9 shrink-0 items-center justify-center rounded-full bg-black text-white transition-all hover:bg-black/90 active:scale-95"
        >
          <IconPlus className="size-5" />
        </Link>
      </div>

      <div className="flex-1 px-6 pb-28">
        <Form route="customer.order.index" className="mb-6">
          {() => (
            <div className="relative">
              <IconSearch className="pointer-events-none absolute top-1/2 left-4 size-4 -translate-y-1/2 text-gray-400" />
              <Input
                type="text"
                name="search"
                defaultValue={filters.search}
                placeholder="Cari nomor pesanan..."
                className="h-11 rounded-xl border-gray-300 bg-gray-50 pl-10 focus-visible:border-black focus-visible:ring-black/10"
              />
            </div>
          )}
        </Form>

        {orders.data.length === 0 ? (
          <Card className="flex flex-col items-center gap-4 rounded-2xl border border-dashed border-gray-300 bg-gray-50 px-6 py-16 text-center">
            <div className="flex size-14 items-center justify-center rounded-full bg-black/10">
              <IconPlus className="size-7 text-black" />
            </div>
            <div className="space-y-1">
              <p className="text-base font-semibold text-black">Belum ada pesanan</p>
              <p className="text-sm text-gray-600">Buat pesanan pertama Anda sekarang</p>
            </div>
            <Link
              route="customer.order.create"
              className={buttonVariants({
                className:
                  'h-11 rounded-xl bg-black px-6 text-sm font-semibold tracking-wide text-white hover:bg-black/90 active:scale-95',
              })}
            >
              Buat Pesanan
            </Link>
          </Card>
        ) : (
          <div className="space-y-4">
            {orders.data.map((order) => (
              <Link
                key={order.id}
                route="customer.order.show"
                routeParams={{ number: order.orderNumber }}
                className="block"
              >
                <Card className="rounded-2xl border border-gray-300 bg-gray-50 p-5 transition-colors hover:bg-gray-100 active:scale-95">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-bold tracking-wide text-black">
                      {order.orderNumber}
                    </p>
                    <Badge className={STATUS_STYLES[order.status] ?? 'bg-gray-200 text-gray-700'}>
                      {order.status}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Jadwal Jemput: {order.pickupDate ?? '-'}</span>
                    <span className="font-semibold text-black">
                      {order.totalPrice ?? 'Belum ada tagihan'}
                    </span>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        )}

        {orders.metadata.lastPage > 1 && (
          <div className="mt-6 flex items-center justify-between">
            <Link
              route="customer.order.index"
              data={{ page: orders.metadata.currentPage - 1, search: filters.search }}
              preserveScroll
              className={buttonVariants({
                variant: 'outline',
                size: 'sm',
                className: `rounded-lg ${orders.metadata.currentPage <= orders.metadata.firstPage ? 'pointer-events-none opacity-40' : ''}`,
              })}
            >
              <IconChevronLeft className="size-4" />
              Sebelumnya
            </Link>

            <p className="text-xs tracking-widest text-gray-500 uppercase">
              {orders.metadata.currentPage} / {orders.metadata.lastPage}
            </p>

            <Link
              route="customer.order.index"
              data={{ page: orders.metadata.currentPage + 1, search: filters.search }}
              preserveScroll
              className={buttonVariants({
                variant: 'outline',
                size: 'sm',
                className: `rounded-lg ${orders.metadata.currentPage >= orders.metadata.lastPage ? 'pointer-events-none opacity-40' : ''}`,
              })}
            >
              Selanjutnya
              <IconChevronRight className="size-4" />
            </Link>
          </div>
        )}
      </div>
    </CustomerLayout>
  )
}
