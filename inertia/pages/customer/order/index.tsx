import { Badge } from '@/components/ui/badge'
import { Button, buttonVariants } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import type { Filters, InertiaProps, Metadata } from '@/types'
import { Link } from '@adonisjs/inertia/react'
import type { Data } from '@/generated/data'
import { IconClipboardList, IconSearch } from '@tabler/icons-react'
import { router } from '@inertiajs/react'
import { useState } from 'react'
import CustomerLayout from '@/components/layouts/customer_layout'
import { urlFor } from '@/client'

type PageProps = InertiaProps<{
  orders: {
    data: Data.Order[]
    metadata: Metadata
  }
  filters: Filters
}>

export default function OrderList({ orders: ordersResponse, filters }: PageProps) {
  const orders = ordersResponse.data
  const metadata = ordersResponse.metadata

  const [search, setSearch] = useState<string>(filters.search ?? '')
  const [isLoading, setIsLoading] = useState<boolean>(false)

  function handleSearch(value: string) {
    setIsLoading(true)

    const url = urlFor(
      'customer.order.index',
      {},
      {
        qs: { page: 1, search: value },
      }
    )

    router.get(url, {}, { preserveScroll: true, onFinish: () => setIsLoading(false) })
  }

  return (
    <CustomerLayout title="Daftar Pesanan" description="Kelola semua pesanan Anda">
      <div className="flex-1 w-full max-w-md space-y-6 mx-auto p-4 pb-24">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-black mb-1">Daftar Pesanan</h2>
          <p className="text-gray-600">Kelola semua pesanan Anda</p>
        </div>

        <div className="flex gap-3 flex-row">
          <div className="relative flex-1">
            <IconSearch className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Cari berdasarkan nomor pesanan, nama, telepon, atau alamat..."
              className="pl-10"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleSearch(search)
                }
              }}
            />
          </div>
          <Button onClick={() => handleSearch(search)} disabled={isLoading}>
            Cari
          </Button>
        </div>

        {orders.length === 0 ? (
          <div className="text-center py-8">
            <IconClipboardList className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
            <h3 className="mb-2 text-lg font-semibold">Tidak ada pesanan ditemukan</h3>
            <p className="text-sm text-muted-foreground">
              {filters.search
                ? 'Coba ubah kriteria pencarian Anda'
                : 'Pesanan yang Anda buat akan muncul di sini'}
            </p>
          </div>
        ) : (
          orders.map((order) => {
            return (
              <Card key={order.id}>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className="flex-1 space-y-2">
                      <Badge>{order.status}</Badge>
                      <h3 className="text-base font-semibold">#{order.orderNumber}</h3>
                      <p className="text-sm text-muted-foreground">{order.createdAt}</p>
                    </div>
                    <Link
                      route="customer.order.show"
                      routeParams={{ number: order.orderNumber }}
                      className={buttonVariants({
                        variant: 'outline',
                      })}
                    >
                      Lihat
                    </Link>
                  </div>
                </CardContent>
              </Card>
            )
          })
        )}

        {metadata.lastPage > 1 && (
          <div className="flex justify-between gap-2 pt-2">
            {metadata.currentPage > 1 ? (
              <Link
                href={urlFor(
                  'customer.order.index',
                  {},
                  {
                    qs: {
                      page: metadata.currentPage - 1,
                      search: filters.search,
                    },
                  }
                )}
                className={buttonVariants({
                  variant: 'outline',
                })}
              >
                Sebelumnya
              </Link>
            ) : (
              <span
                className={`${buttonVariants({
                  variant: 'outline',
                })} pointer-events-none opacity-50`}
              >
                Sebelumnya
              </span>
            )}

            <span className="text-sm text-muted-foreground self-center">
              {metadata.currentPage} / {metadata.lastPage}
            </span>

            {metadata.currentPage < metadata.lastPage ? (
              <Link
                href={urlFor(
                  'customer.order.index',
                  {},
                  {
                    qs: {
                      page: metadata.currentPage + 1,
                      search: filters.search,
                    },
                  }
                )}
                className={buttonVariants({
                  variant: 'outline',
                })}
              >
                Selanjutnya
              </Link>
            ) : (
              <span
                className={`${buttonVariants({
                  variant: 'outline',
                })} pointer-events-none opacity-50`}
              >
                Selanjutnya
              </span>
            )}
          </div>
        )}
      </div>
    </CustomerLayout>
  )
}
