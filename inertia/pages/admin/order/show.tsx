import AdminLayout from '@/components/layouts/admin_layout'
import { PageHeader } from '@/components/molecules/page_header'
import { Badge } from '@/components/ui/badge'
import { buttonVariants } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { orderStatusStyles, transactionStatusStyles } from '@/lib/constants'
import type { Data } from '@/generated/data'
import type { InertiaProps } from '@/types'
import { Link } from '@adonisjs/inertia/react'
import { IconArrowLeft } from '@tabler/icons-react'

type PageProps = InertiaProps<{
  order: Data.Order
  items: Data.OrderItem[]
  actions: Data.OrderAction[]
}>

function Detail({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div className="border-b border-gray-200 py-3 last:border-0">
      <p className="text-xs tracking-widest text-gray-500 uppercase">{label}</p>
      <p className="mt-1 text-sm font-medium text-black">{value ?? '-'}</p>
    </div>
  )
}

export default function Show({ order, items, actions }: PageProps) {
  return (
    <AdminLayout title={order.orderNumber} description="Detail pesanan UmimaClean">
      <PageHeader
        eyebrow="Pesanan"
        title={order.orderNumber}
        description={`${order.type} · dibuat ${order.createdAt}`}
        action={
          <Link
            route="admin.order.index"
            className={buttonVariants({
              variant: 'outline',
              className: 'rounded-xl border-gray-300',
            })}
          >
            <IconArrowLeft className="size-4" />
            Kembali
          </Link>
        }
      />

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="rounded-2xl border border-gray-200 bg-gray-50">
          <CardHeader className="flex items-center justify-between gap-3">
            <p className="text-xs font-medium tracking-widest text-gray-600 uppercase">Ringkasan</p>
            <Badge className={orderStatusStyles[order.statusValue] ?? 'bg-gray-200 text-gray-700'}>
              {order.status}
            </Badge>
          </CardHeader>
          <CardContent className="flex flex-col">
            <Detail label="Pelanggan" value={order.customerName} />
            <Detail label="Telepon" value={order.customerPhone} />
            <Detail label="Akun" value={order.user?.name ?? 'Tanpa akun (offline)'} />
            <Detail label="Jadwal Jemput" value={order.pickupDate ?? '-'} />
            <Detail label="Total" value={order.totalPrice ?? 'Belum ada tagihan'} />
          </CardContent>
        </Card>

        <Card className="rounded-2xl border border-gray-200 bg-gray-50 lg:col-span-2">
          <CardHeader>
            <p className="text-xs font-medium tracking-widest text-gray-600 uppercase">
              Alamat Penjemputan
            </p>
          </CardHeader>
          <CardContent>
            {order.address ? (
              <div className="flex flex-col">
                <Detail label="Penerima" value={order.address.name} />
                <Detail label="Telepon" value={order.address.phone} />
                <Detail label="Alamat" value={order.address.street} />
                <Detail label="Catatan" value={order.address.note} />
              </div>
            ) : (
              <p className="py-6 text-sm text-gray-500">
                Pesanan offline — barang diantar langsung ke toko dan diambil di konter.
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="mt-4 rounded-2xl border border-gray-200 bg-white">
        <CardHeader>
          <p className="text-xs font-medium tracking-widest text-gray-600 uppercase">
            Rincian Barang
          </p>
        </CardHeader>
        <CardContent>
          {items.length === 0 ? (
            <p className="py-6 text-center text-sm text-gray-500">
              Barang belum diinspeksi, sehingga belum ada rincian harga
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Layanan</TableHead>
                  <TableHead>Barang</TableHead>
                  <TableHead className="text-right">Harga</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>{item.service?.name ?? item.name}</TableCell>
                    <TableCell className="text-gray-600">
                      {item.item ? `${item.item.brand} ${item.item.model}` : '-'}
                    </TableCell>
                    <TableCell className="text-right">{item.subtotal}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <Card className="rounded-2xl border border-gray-200 bg-white">
          <CardHeader>
            <p className="text-xs font-medium tracking-widest text-gray-600 uppercase">Transaksi</p>
          </CardHeader>
          <CardContent>
            {!order.transactions || order.transactions.length === 0 ? (
              <p className="py-6 text-center text-sm text-gray-500">Belum ada transaksi</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Metode</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Tanggal</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {order.transactions.map((transaction) => (
                    <TableRow key={transaction.id}>
                      <TableCell>{transaction.paymentMethod}</TableCell>
                      <TableCell>
                        <Badge
                          className={
                            transactionStatusStyles[transaction.statusValue] ??
                            'bg-gray-200 text-gray-700'
                          }
                        >
                          {transaction.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-gray-600">{transaction.createdAt}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/*
          The audit trail. Every action names the staff member who recorded it,
          which is what makes a manual payment override attributable.
        */}
        <Card className="rounded-2xl border border-gray-200 bg-white">
          <CardHeader>
            <p className="text-xs font-medium tracking-widest text-gray-600 uppercase">
              Riwayat Tindakan
            </p>
          </CardHeader>
          <CardContent>
            {actions.length === 0 ? (
              <p className="py-6 text-center text-sm text-gray-500">Belum ada tindakan</p>
            ) : (
              <ul className="flex flex-col divide-y divide-gray-200">
                {actions.map((action) => (
                  <li key={action.id} className="py-3">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm font-medium text-black">{action.name}</p>
                      <p className="text-xs text-gray-500">{action.createdAt}</p>
                    </div>
                    <p className="text-xs text-gray-600">
                      oleh {action.staff?.name ?? 'petugas tidak diketahui'}
                    </p>
                    {action.note && <p className="mt-1 text-xs text-gray-600">{action.note}</p>}
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  )
}
