import { OrderStatusLabel, OrderTypeLabel } from '@/enums/order_enum'
import AdminLayout from '@/components/layouts/admin_layout'
import { ExportButton } from '@/components/molecules/export_button'
import { PageHeader } from '@/components/molecules/page_header'
import { Pagination } from '@/components/molecules/pagination'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { neutralBadgeStyle, orderStatusStyles, orderTypeStyles } from '@/lib/constants'
import { formatShortDate, formatRupiah } from '@/lib/format'
import type { Data } from '@/generated/data'
import type { InertiaProps, Metadata } from '@/types'
import { Form, Link } from '@adonisjs/inertia/react'
import { IconSearch } from '@tabler/icons-react'

type Option = { value: string; label: string }

type PageProps = InertiaProps<{
  orders: { data: Data.Order.Variants['toListItem'][]; metadata: Metadata }
  filters: { search: string; page: number; status: string; type: string }
  statusOptions: Option[]
  typeOptions: Option[]
}>

export default function Index({ orders, filters, statusOptions, typeOptions }: PageProps) {
  return (
    <AdminLayout title="Pesanan" description="Pantau seluruh pesanan UmimaClean">
      <PageHeader
        eyebrow="Admin"
        title="Pemantauan Pesanan"
        description="Seluruh pesanan online dan offline"
        action={<ExportButton />}
      />

      <Form route="admin.order.index" className="mb-6">
        {() => (
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative min-w-56 flex-1">
              <IconSearch className="pointer-events-none absolute top-1/2 left-4 size-4 -translate-y-1/2 text-ink-faint" />
              <Input
                type="text"
                name="search"
                aria-label="Cari pesanan"
                defaultValue={filters.search}
                placeholder="Cari nomor, nama, atau telepon..."
                className="h-11 rounded-none border-rule-field bg-paper-tint pl-10 focus-visible:border-ink focus-visible:ring-black/10"
              />
            </div>

            <select
              name="status"
              aria-label="Status"
              defaultValue={filters.status}
              className="h-11 rounded-none border border-rule-field bg-paper-tint px-3 text-sm text-ink"
            >
              <option value="">Semua Status</option>
              {statusOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>

            <select
              name="type"
              aria-label="Tipe"
              defaultValue={filters.type}
              className="h-11 rounded-none border border-rule-field bg-paper-tint px-3 text-sm text-ink"
            >
              <option value="">Semua Tipe</option>
              {typeOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>

            <Button
              type="submit"
              className="h-11 rounded-none bg-ink px-6 text-white hover:bg-ink/90 active:scale-95"
            >
              Terapkan
            </Button>
          </div>
        )}
      </Form>

      <Card className="rounded-none border border-rule bg-white">
        <CardContent>
          {orders.data.length === 0 ? (
            <p className="py-12 text-center text-sm text-ink-subtle">
              Tidak ada pesanan yang cocok dengan filter ini
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nomor</TableHead>
                  <TableHead>Pelanggan</TableHead>
                  <TableHead>Tipe</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Dibuat</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orders.data.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell className="font-semibold">
                      <Link
                        route="admin.order.show"
                        routeParams={{ number: order.orderNumber }}
                        className="underline"
                      >
                        {order.orderNumber}
                      </Link>
                    </TableCell>
                    <TableCell>
                      <p className="text-ink">{order.customerName}</p>
                      <p className="text-xs text-ink-subtle">{order.customerPhone}</p>
                    </TableCell>
                    <TableCell>
                      <Badge className={orderTypeStyles[order.type] ?? neutralBadgeStyle}>
                        {OrderTypeLabel[order.type as keyof typeof OrderTypeLabel]}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={orderStatusStyles[order.status] ?? neutralBadgeStyle}>
                        {OrderStatusLabel[order.status as keyof typeof OrderStatusLabel]}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-ink-soft">
                      {formatShortDate(order.createdAt)}
                    </TableCell>
                    <TableCell className="text-right">
                      {order.totalPrice === null ? '-' : formatRupiah(order.totalPrice)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Pagination metadata={orders.metadata} />
    </AdminLayout>
  )
}
