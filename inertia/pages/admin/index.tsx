import { OrderStatusLabel, OrderTypeLabel } from '@/enums/order_enum'
import AdminLayout from '@/components/layouts/admin_layout'
import { ExportButton } from '@/components/molecules/export_button'
import { PageHeader } from '@/components/molecules/page_header'
import { LiveOrders } from '@/components/molecules/live_orders'
import { StatCard } from '@/components/molecules/stat_card'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { neutralBadgeStyle, orderStatusStyles, orderTypeStyles } from '@/lib/constants'
import { formatRupiah } from '@/lib/format'
import type { Data } from '@/generated/data'
import type { InertiaProps } from '@/types'
import { Link } from '@adonisjs/inertia/react'
import { IconAlertTriangle, IconCash, IconClipboardList, IconUsers } from '@tabler/icons-react'
import { Area, AreaChart, Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts'

type Breakdown = { value: string; label: string; total: number }

type PageProps = InertiaProps<{
  summary: {
    totalOrders: number
    activeOrders: number
    completedOrders: number
    awaitingPayment: number
    revenue: number
    customers: number
    staff: number
  }
  statusBreakdown: Breakdown[]
  typeSplit: Breakdown[]
  revenueTrend: { date: string; label: string; total: number }[]
  pickupLoad: { date: string; label: string; booked: number; capacity: number }[]
  recentOrders: Data.Order[]
}>

const revenueChartConfig = {
  total: { label: 'Pendapatan', color: '#111827' },
} as const

const pickupChartConfig = {
  booked: { label: 'Terjadwal', color: '#111827' },
} as const

export default function Index({
  summary,
  statusBreakdown,
  typeSplit,
  revenueTrend,
  pickupLoad,
  recentOrders,
}: PageProps) {
  const totalTyped = typeSplit.reduce((total, slice) => total + slice.total, 0)

  return (
    <AdminLayout title="Dasbor" description="Ringkasan operasional UmimaClean">
      <PageHeader
        eyebrow="Admin"
        title="Dasbor"
        description="Ringkasan operasional dan pendapatan"
        action={<ExportButton />}
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Total Pesanan"
          value={summary.totalOrders}
          hint={`${summary.activeOrders} sedang berjalan`}
          icon={IconClipboardList}
        />
        <StatCard
          label="Pendapatan"
          value={formatRupiah(summary.revenue)}
          hint={`${summary.completedOrders} pesanan selesai`}
          icon={IconCash}
        />
        <StatCard
          label="Menunggu Pelunasan"
          value={summary.awaitingPayment}
          hint="Perlu dicek di Rekonsiliasi"
          icon={IconAlertTriangle}
        />
        <StatCard
          label="Pelanggan"
          value={summary.customers}
          hint={`${summary.staff} petugas`}
          icon={IconUsers}
        />
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <Card className="rounded-none border border-rule bg-white">
          <CardHeader>
            <p className="text-xs font-medium tracking-widest text-ink-soft uppercase">
              Pendapatan 14 Hari Terakhir
            </p>
          </CardHeader>
          <CardContent>
            <ChartContainer config={revenueChartConfig} className="h-56 w-full">
              <AreaChart data={revenueTrend} margin={{ left: 4, right: 4 }}>
                <CartesianGrid vertical={false} strokeDasharray="3 3" />
                <XAxis dataKey="label" tickLine={false} axisLine={false} tickMargin={8} />
                <YAxis hide />
                <ChartTooltip
                  content={
                    <ChartTooltipContent formatter={(value) => formatRupiah(Number(value))} />
                  }
                />
                <Area
                  dataKey="total"
                  type="monotone"
                  stroke="var(--color-total)"
                  fill="var(--color-total)"
                  fillOpacity={0.12}
                  strokeWidth={2}
                />
              </AreaChart>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card className="rounded-none border border-rule bg-white">
          <CardHeader>
            <p className="text-xs font-medium tracking-widest text-ink-soft uppercase">
              Beban Penjemputan 7 Hari
            </p>
          </CardHeader>
          <CardContent>
            <ChartContainer config={pickupChartConfig} className="h-56 w-full">
              <BarChart data={pickupLoad} margin={{ left: 4, right: 4 }}>
                <CartesianGrid vertical={false} strokeDasharray="3 3" />
                <XAxis dataKey="label" tickLine={false} axisLine={false} tickMargin={8} />
                <YAxis allowDecimals={false} width={24} tickLine={false} axisLine={false} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="booked" fill="var(--color-booked)" radius={4} />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <Card className="rounded-none border border-rule bg-paper-tint lg:col-span-2">
          <CardHeader>
            <p className="text-xs font-medium tracking-widest text-ink-soft uppercase">
              Pesanan per Status
            </p>
          </CardHeader>
          <CardContent className="grid gap-2 sm:grid-cols-2">
            {statusBreakdown.map((slice) => (
              <div
                key={slice.value}
                className="flex items-center justify-between gap-3 border-b border-rule py-2 last:border-0"
              >
                <span className="text-sm text-ink-body">{slice.label}</span>
                <span className="text-sm font-semibold text-ink">{slice.total}</span>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="rounded-none border border-rule bg-paper-tint">
          <CardHeader>
            <p className="text-xs font-medium tracking-widest text-ink-soft uppercase">
              Online vs Offline
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            {typeSplit.map((slice) => {
              const share = totalTyped > 0 ? Math.round((slice.total / totalTyped) * 100) : 0

              return (
                <div key={slice.value}>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-ink-body">{slice.label}</span>
                    <span className="font-semibold text-ink">
                      {slice.total} ({share}%)
                    </span>
                  </div>
                  <div className="mt-1 h-2 w-full rounded-full bg-paper-tint">
                    <div className="h-2 rounded-full bg-ink" style={{ width: `${share}%` }} />
                  </div>
                </div>
              )
            })}
          </CardContent>
        </Card>
      </div>

      <div className="mt-6">
        <LiveOrders />
      </div>

      <Card className="mt-6 rounded-none border border-rule bg-white">
        <CardHeader className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-xs font-medium tracking-widest text-ink-soft uppercase">
            Pesanan Terbaru
          </p>
          <Link route="admin.order.index" className="text-sm font-medium text-ink underline">
            Lihat semua
          </Link>
        </CardHeader>
        <CardContent>
          {recentOrders.length === 0 ? (
            <p className="py-6 text-center text-sm text-ink-subtle">Belum ada pesanan</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nomor</TableHead>
                  <TableHead>Pelanggan</TableHead>
                  <TableHead>Tipe</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentOrders.map((order) => (
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
                    <TableCell>{order.customerName}</TableCell>
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
    </AdminLayout>
  )
}
