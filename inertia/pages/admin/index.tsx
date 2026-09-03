import AdminLayout from '@/components/layouts/admin_layout'
import {
  Panel,
  PanelBody,
  PanelHeader,
  SectionLabel,
  StatusBadge,
} from '@/components/atoms/editorial'
import { DataTable, type Column } from '@/components/molecules/data_table'
import { ExportButton } from '@/components/molecules/export_button'
import { PageHeader } from '@/components/molecules/page_header'
import { LiveOrders } from '@/components/molecules/live_orders'
import { StatCard } from '@/components/molecules/stat_card'
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart'
import { neutralTone, orderStatusTones, orderTypeTones } from '@/lib/constants'
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
    revenueLabel: string
    customers: number
    staff: number
  }
  statusBreakdown: Breakdown[]
  typeSplit: Breakdown[]
  revenueTrend: { date: string; label: string; total: number; totalLabel: string }[]
  pickupLoad: { date: string; label: string; booked: number; capacity: number }[]
  recentOrders: Data.Order[]
}>

const revenueChartConfig = {
  total: { label: 'Pendapatan', color: 'var(--color-ink)' },
} as const

const pickupChartConfig = {
  booked: { label: 'Terjadwal', color: 'var(--color-ink)' },
} as const

const recentColumns: Column<Data.Order>[] = [
  {
    key: 'orderNumber',
    header: 'Nomor',
    role: 'primary',
    cell: (order) => (
      <Link
        route="admin.order.show"
        routeParams={{ number: order.orderNumber }}
        className="font-semibold text-ink underline underline-offset-4"
      >
        {order.orderNumber}
      </Link>
    ),
  },
  {
    key: 'customerName',
    header: 'Pelanggan',
    role: 'meta',
    cell: (order) => order.customerName,
  },
  {
    key: 'type',
    header: 'Tipe',
    cell: (order) => (
      <StatusBadge tone={orderTypeTones[order.type] ?? neutralTone}>{order.typeLabel}</StatusBadge>
    ),
  },
  {
    key: 'status',
    header: 'Status',
    role: 'trailing',
    cell: (order) => (
      <StatusBadge tone={orderStatusTones[order.status] ?? neutralTone}>
        {order.statusLabel}
      </StatusBadge>
    ),
  },
  {
    key: 'totalPrice',
    header: 'Total',
    align: 'right',
    cellClassName: 'font-semibold text-ink',
    cell: (order) => order.totalPriceLabel,
  },
]

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

      <div className="grid gap-3 tablet:grid-cols-2 desktop:grid-cols-4">
        <StatCard
          label="Total Pesanan"
          value={summary.totalOrders}
          hint={`${summary.activeOrders} sedang berjalan`}
          icon={IconClipboardList}
        />
        <StatCard
          label="Pendapatan"
          value={summary.revenueLabel}
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

      <div className="mt-4 grid gap-3 desktop:grid-cols-2">
        <Panel>
          <PanelHeader>
            <SectionLabel>Pendapatan 14 Hari Terakhir</SectionLabel>
          </PanelHeader>
          <PanelBody>
            <ChartContainer config={revenueChartConfig} className="h-56 w-full">
              <AreaChart data={revenueTrend} margin={{ left: 4, right: 4 }}>
                <CartesianGrid vertical={false} strokeDasharray="3 3" />
                <XAxis dataKey="label" tickLine={false} axisLine={false} tickMargin={8} />
                <YAxis hide />
                <ChartTooltip
                  content={
                    <ChartTooltipContent formatter={(_, __, item) => item.payload.totalLabel} />
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
          </PanelBody>
        </Panel>

        <Panel>
          <PanelHeader>
            <SectionLabel>Beban Penjemputan 7 Hari</SectionLabel>
          </PanelHeader>
          <PanelBody>
            <ChartContainer config={pickupChartConfig} className="h-56 w-full">
              <BarChart data={pickupLoad} margin={{ left: 4, right: 4 }}>
                <CartesianGrid vertical={false} strokeDasharray="3 3" />
                <XAxis dataKey="label" tickLine={false} axisLine={false} tickMargin={8} />
                <YAxis allowDecimals={false} width={24} tickLine={false} axisLine={false} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="booked" fill="var(--color-booked)" />
              </BarChart>
            </ChartContainer>
          </PanelBody>
        </Panel>
      </div>

      <div className="mt-4 grid gap-3 desktop:grid-cols-3">
        <Panel tone="tint" className="desktop:col-span-2">
          <PanelHeader>
            <SectionLabel>Pesanan per Status</SectionLabel>
          </PanelHeader>
          <PanelBody className="grid gap-x-8 tablet:grid-cols-2">
            {statusBreakdown.map((slice) => (
              <div
                key={slice.value}
                className="flex items-center justify-between gap-3 border-b border-rule py-2.5 last:border-b-0 tablet:nth-last-2:border-b-0"
              >
                <span className="text-small leading-normal text-ink-body">{slice.label}</span>
                <span className="text-small leading-normal font-semibold text-ink">
                  {slice.total}
                </span>
              </div>
            ))}
          </PanelBody>
        </Panel>

        <Panel tone="tint">
          <PanelHeader>
            <SectionLabel>Online vs Offline</SectionLabel>
          </PanelHeader>
          <PanelBody className="flex flex-col gap-4">
            {typeSplit.map((slice) => {
              const share = totalTyped > 0 ? Math.round((slice.total / totalTyped) * 100) : 0

              return (
                <div key={slice.value}>
                  <div className="flex items-center justify-between gap-3 text-small leading-normal">
                    <span className="text-ink-body">{slice.label}</span>
                    <span className="font-semibold text-ink">
                      {slice.total} ({share}%)
                    </span>
                  </div>
                  <div className="mt-1.5 h-1.5 w-full bg-white">
                    <div className="h-1.5 bg-ink" style={{ width: `${share}%` }} />
                  </div>
                </div>
              )
            })}
          </PanelBody>
        </Panel>
      </div>

      <div className="mt-4">
        <LiveOrders />
      </div>

      <div className="mt-4">
        <Panel className="border-b-0">
          <PanelHeader>
            <SectionLabel>Pesanan Terbaru</SectionLabel>
            <Link
              route="admin.order.index"
              className="text-meta font-medium text-ink underline underline-offset-4"
            >
              Lihat semua
            </Link>
          </PanelHeader>
        </Panel>
        <DataTable
          columns={recentColumns}
          rows={recentOrders}
          getKey={(order) => order.id}
          empty="Belum ada pesanan"
        />
      </div>
    </AdminLayout>
  )
}
