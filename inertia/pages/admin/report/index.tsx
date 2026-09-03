import AdminLayout from '@/components/layouts/admin_layout'
import {
  BoxInput,
  Panel,
  PanelBody,
  PanelHeader,
  SectionLabel,
  SolidButton,
} from '@/components/atoms/editorial'
import { BreakdownPanel, type MoneyBreakdown } from '@/components/molecules/breakdown_panel'
import { DataTable, type Column } from '@/components/molecules/data_table'
import { ExportButton } from '@/components/molecules/export_button'
import { PageHeader } from '@/components/molecules/page_header'
import { StatCard } from '@/components/molecules/stat_card'
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart'
import { Field, FieldLabel } from '@/components/ui/field'
import type { InertiaProps } from '@/types'
import { Form } from '@adonisjs/inertia/react'
import { IconCash, IconReceipt2, IconTrendingUp } from '@tabler/icons-react'
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts'

type TopService = {
  id: number
  name: string
  category: string
  orders: number
  revenue: number
  revenueLabel: string
}

type PageProps = InertiaProps<{
  report: {
    from: string
    to: string
    label: string
    totalRevenue: number
    totalRevenueLabel: string
    paidOrders: number
    averageOrderValue: number
    averageOrderValueLabel: string
    series: { date: string; label: string; total: number; totalLabel: string }[]
    byPaymentMethod: MoneyBreakdown[]
    byType: MoneyBreakdown[]
    topServices: TopService[]
  }
}>

const chartConfig = {
  total: { label: 'Pendapatan', color: 'var(--color-ink)' },
} as const

const topServiceColumns: Column<TopService>[] = [
  { key: 'name', header: 'Layanan', role: 'primary', cell: (catalogue) => catalogue.name },
  {
    key: 'revenue',
    header: 'Pendapatan',
    align: 'right',
    role: 'trailing',
    cell: (catalogue) => (
      <span className="text-body font-semibold text-ink tablet:text-small">
        {catalogue.revenueLabel}
      </span>
    ),
  },
  {
    key: 'orders',
    header: 'Terjual',
    align: 'right',
    role: 'meta',
    cell: (catalogue) => `${catalogue.orders} terjual`,
  },
]

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
        <StatCard label="Total Pendapatan" value={report.totalRevenueLabel} icon={IconCash} />
        <StatCard label="Pesanan Terbayar" value={report.paidOrders} icon={IconReceipt2} />
        <StatCard
          label="Rata-rata per Pesanan"
          value={report.averageOrderValueLabel}
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
                content={
                  <ChartTooltipContent formatter={(_, __, item) => item.payload.totalLabel} />
                }
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
          getKey={(catalogue) => catalogue.id}
          empty="Belum ada layanan terjual pada rentang ini"
        />
      </div>
    </AdminLayout>
  )
}
