import { OrderStatusLabel, OrderTypeLabel } from '@/enums/order_enum'
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
import { neutralBadgeStyle, orderStatusStyles, transactionStatusStyles } from '@/lib/constants'
import { ActionNameLabel } from '@/enums/order_action_enum'
import { PaymentMethodLabel, TransactionStatusLabel } from '@/enums/transaction_enum'
import { formatDate, formatDateTime, formatRupiah } from '@/lib/format'
import type { Data } from '@/generated/data'
import type { InertiaProps } from '@/types'
import { Link } from '@adonisjs/inertia/react'
import { IconArrowLeft } from '@tabler/icons-react'

type PageProps = InertiaProps<{
  order: Data.Order.Variants['toDetail']
}>

function Detail({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div className="border-b border-rule py-3 last:border-0">
      <p className="text-xs tracking-widest text-ink-subtle uppercase">{label}</p>
      <p className="mt-1 text-sm font-medium text-ink">{value ?? '-'}</p>
    </div>
  )
}

export default function Show({ order }: PageProps) {
  const items = order.items ?? []
  const actions = order.actions ?? []

  return (
    <AdminLayout title={order.orderNumber} description="Detail pesanan UmimaClean">
      <PageHeader
        eyebrow="Pesanan"
        title={order.orderNumber}
        description={`${OrderTypeLabel[order.type as keyof typeof OrderTypeLabel]} · dibuat ${formatDate(order.createdAt)}`}
        action={
          <Link
            route="admin.order.index"
            className={buttonVariants({
              variant: 'outline',
              className: 'rounded-none border-rule-field',
            })}
          >
            <IconArrowLeft className="size-4" />
            Kembali
          </Link>
        }
      />

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="rounded-none border border-rule bg-paper-tint">
          <CardHeader className="flex items-center justify-between gap-3">
            <p className="text-xs font-medium tracking-widest text-ink-soft uppercase">Ringkasan</p>
            <Badge className={orderStatusStyles[order.status] ?? neutralBadgeStyle}>
              {OrderStatusLabel[order.status as keyof typeof OrderStatusLabel]}
            </Badge>
          </CardHeader>
          <CardContent className="flex flex-col">
            <Detail label="Pelanggan" value={order.customerName} />
            <Detail label="Telepon" value={order.customerPhone} />
            <Detail label="Akun" value={order.user?.name ?? 'Tanpa akun (offline)'} />
            <Detail label="Jadwal Jemput" value={formatDate(order.pickupDate)} />
            <Detail
              label="Total"
              value={
                order.totalPrice === null ? 'Belum ada tagihan' : formatRupiah(order.totalPrice)
              }
            />
          </CardContent>
        </Card>

        <Card className="rounded-none border border-rule bg-paper-tint lg:col-span-2">
          <CardHeader>
            <p className="text-xs font-medium tracking-widest text-ink-soft uppercase">
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
              <p className="py-6 text-sm text-ink-subtle">
                Pesanan offline — barang diantar langsung ke toko dan diambil di konter.
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="mt-4 rounded-none border border-rule bg-white">
        <CardHeader>
          <p className="text-xs font-medium tracking-widest text-ink-soft uppercase">
            Rincian Barang
          </p>
        </CardHeader>
        <CardContent>
          {items.length === 0 ? (
            <p className="py-6 text-center text-sm text-ink-subtle">
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
                    <TableCell className="text-ink-soft">
                      {item.item ? `${item.item.brand} ${item.item.model}` : '-'}
                    </TableCell>
                    <TableCell className="text-right">{formatRupiah(item.subtotal)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <Card className="rounded-none border border-rule bg-white">
          <CardHeader>
            <p className="text-xs font-medium tracking-widest text-ink-soft uppercase">Transaksi</p>
          </CardHeader>
          <CardContent>
            {!order.transactions || order.transactions.length === 0 ? (
              <p className="py-6 text-center text-sm text-ink-subtle">Belum ada transaksi</p>
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
                      <TableCell>
                        {
                          PaymentMethodLabel[
                            transaction.paymentMethod as keyof typeof PaymentMethodLabel
                          ]
                        }
                      </TableCell>
                      <TableCell>
                        <Badge
                          className={
                            transactionStatusStyles[transaction.status] ?? neutralBadgeStyle
                          }
                        >
                          {
                            TransactionStatusLabel[
                              transaction.status as keyof typeof TransactionStatusLabel
                            ]
                          }
                        </Badge>
                      </TableCell>
                      <TableCell className="text-ink-soft">
                        {formatDateTime(transaction.createdAt)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <Card className="rounded-none border border-rule bg-white">
          <CardHeader>
            <p className="text-xs font-medium tracking-widest text-ink-soft uppercase">
              Riwayat Tindakan
            </p>
          </CardHeader>
          <CardContent>
            {actions.length === 0 ? (
              <p className="py-6 text-center text-sm text-ink-subtle">Belum ada tindakan</p>
            ) : (
              <ul className="flex flex-col divide-y divide-rule">
                {actions.map((action) => (
                  <li key={action.id} className="py-3">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm font-medium text-ink">
                        {ActionNameLabel[action.name as keyof typeof ActionNameLabel] ??
                          action.name}
                      </p>
                      <p className="text-xs text-ink-subtle">{formatDateTime(action.createdAt)}</p>
                    </div>
                    <p className="text-xs text-ink-soft">
                      oleh {action.staff?.name ?? 'petugas tidak diketahui'}
                    </p>
                    {action.note && <p className="mt-1 text-xs text-ink-soft">{action.note}</p>}
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
