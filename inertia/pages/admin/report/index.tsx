import AdminLayout from '@/components/layouts/admin_layout'
import {
  BoxInput,
  Panel,
  PanelBody,
  PanelHeader,
  SectionLabel,
  SolidButton,
} from '@/components/atoms/editorial'
import { DataTable, type Column } from '@/components/molecules/data_table'
import { ExportButton } from '@/components/molecules/export_button'
import { PageHeader } from '@/components/molecules/page_header'
import { StatCard } from '@/components/molecules/stat_card'
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart'
import { Field, FieldLabel } from '@/components/ui/field'
import { formatRupiah } from '@/lib/format'
import type { InertiaProps } from '@/types'
import { Form } from '@adonisjs/inertia/react'
import { IconCash, IconReceipt2, IconTrendingUp } from '@tabler/icons-react'
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts'

type MoneyBreakdown = {
  value: string
  label: string
  orders: number
  revenue: number
}

type TopService = {
  id: number
  name: string
  category: string
  orders: number
  revenue: number
}

type PageProps = InertiaProps<{
  report: {
    from: string
    to: string
    label: string
    totalRevenue: number
    paidOrders: number
    averageOrderValue: number
    series: { date: string; label: string; total: number }[]
    byPaymentMethod: MoneyBreakdown[]
    byType: MoneyBreakdown[]
    topServices: TopService[]
  }
}>

const chartConfig = {
  total: { label: 'Pendapatan', color: 'var(--color-ink)' },
} as const

const breakdownColumns: Column<MoneyBreakdown>[] = [
  { key: 'label', header: 'Nama', role: 'primary', cell: (row) => row.label },
  {
    key: 'revenue',
    header: 'Pendapatan',
    align: 'right',
    role: 'trailing',
    cell: (row) => (
      <span className="text-body font-semibold text-ink tablet:text-small">
        {formatRupiah(row.revenue)}
      </span>
    ),
  },
  {
    key: 'orders',
    header: 'Pesanan',
    align: 'right',
    role: 'meta',
    cell: (row) => `${row.orders} pesanan`,
  },
]

const topServiceColumns: Column<TopService>[] = [
  { key: 'name', header: 'Layanan', role: 'primary', cell: (service) => service.name },
  {
    key: 'revenue',
    header: 'Pendapatan',
    align: 'right',
    role: 'trailing',
    cell: (service) => (
      <span className="text-body font-semibold text-ink tablet:text-small">
        {formatRupiah(service.revenue)}
      </span>
    ),
  },
  {
    key: 'orders',
    header: 'Terjual',
    align: 'right',
    role: 'meta',
    cell: (service) => `${service.orders} terjual`,
  },
]

function BreakdownPanel({ title, rows }: { title: string; rows: MoneyBreakdown[] }) {
  return (
    <div>
      <Panel className="border-b-0">
        <PanelHeader>
          <SectionLabel>{title}</SectionLabel>
        </PanelHeader>
      </Panel>
      <DataTable
        columns={breakdownColumns}
        rows={rows}
        getKey={(row) => row.value}
        empty="Belum ada data pada rentang ini"
      />
    </div>
  )
}

export default function Index({ report }: PageProps) {
  return (
    <AdminLayout title="Laporan" description="Laporan pendapatan UmimaClean">
      <PageHeader
        eyebrow="Admin"
        title="Laporan Pendapatan"
        description={report.label}
        action={<ExportButton />}
      />

      <Form route="admin.report.index" className="mb-5">
        {() => (
          <div className="flex flex-col gap-2.5 tablet:flex-row tablet:items-end">
            <Field className="tablet:w-44">
              <FieldLabel htmlFor="from" className="field-label mb-2">
                Dari
              </FieldLabel>
              <BoxInput id="from" name="from" type="date" defaultValue={report.from} />
            </Field>

            <Field className="tablet:w-44">
              <FieldLabel htmlFor="to" className="field-label mb-2">
                Sampai
              </FieldLabel>
              <BoxInput id="to" name="to" type="date" defaultValue={report.to} />
            </Field>

            <SolidButton type="submit" className="py-3 tablet:w-auto tablet:px-8">
              Tampilkan
            </SolidButton>
          </div>
        )}
      </Form>

      <div className="grid gap-3 tablet:grid-cols-3">
        <StatCard
          label="Total Pendapatan"
          value={formatRupiah(report.totalRevenue)}
          icon={IconCash}
        />
        <StatCard label="Pesanan Terbayar" value={report.paidOrders} icon={IconReceipt2} />
        <StatCard
          label="Rata-rata per Pesanan"
          value={formatRupiah(report.averageOrderValue)}
          icon={IconTrendingUp}
        />
      </div>

      <Panel className="mt-4">
        <PanelHeader>
          <SectionLabel>Pendapatan Harian</SectionLabel>
        </PanelHeader>
        <PanelBody>
          <ChartContainer config={chartConfig} className="h-64 w-full">
            <BarChart data={report.series} margin={{ left: 4, right: 4 }}>
              <CartesianGrid vertical={false} strokeDasharray="3 3" />
              <XAxis dataKey="label" tickLine={false} axisLine={false} tickMargin={8} />
              <YAxis hide />
              <ChartTooltip
                content={<ChartTooltipContent formatter={(value) => formatRupiah(Number(value))} />}
              />
              <Bar dataKey="total" fill="var(--color-total)" />
            </BarChart>
          </ChartContainer>
        </PanelBody>
      </Panel>

      <div className="mt-4 grid gap-3 desktop:grid-cols-2">
        <BreakdownPanel title="Metode Pembayaran" rows={report.byPaymentMethod} />
        <BreakdownPanel title="Tipe Pesanan" rows={report.byType} />
      </div>

      <div className="mt-4">
        <Panel className="border-b-0">
          <PanelHeader>
            <SectionLabel>Layanan Terlaris</SectionLabel>
          </PanelHeader>
        </Panel>
        <DataTable
          columns={topServiceColumns}
          rows={report.topServices}
          getKey={(service) => service.id}
          empty="Belum ada layanan terjual pada rentang ini"
        />
      </div>
    </AdminLayout>
  )
}
