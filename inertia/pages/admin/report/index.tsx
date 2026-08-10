import AdminLayout from '@/components/layouts/admin_layout'
import { ExportButton } from '@/components/molecules/export_button'
import { PageHeader } from '@/components/molecules/page_header'
import { StatCard } from '@/components/molecules/stat_card'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart'
import { Field, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
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
    topServices: {
      id: number
      name: string
      category: string
      orders: number
      revenue: number
    }[]
  }
}>

const chartConfig = {
  total: { label: 'Pendapatan', color: '#111827' },
} as const

function BreakdownTable({ title, rows }: { title: string; rows: MoneyBreakdown[] }) {
  return (
    <Card className="rounded-none border border-rule bg-white">
      <CardHeader>
        <p className="text-xs font-medium tracking-widest text-ink-soft uppercase">{title}</p>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nama</TableHead>
              <TableHead className="text-right">Pesanan</TableHead>
              <TableHead className="text-right">Pendapatan</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => (
              <TableRow key={row.value}>
                <TableCell>{row.label}</TableCell>
                <TableCell className="text-right">{row.orders}</TableCell>
                <TableCell className="text-right font-semibold">
                  {formatRupiah(row.revenue)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
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

      <Form route="admin.report.index" className="mb-6">
        {() => (
          <div className="flex flex-wrap items-end gap-3">
            <Field className="w-44">
              <FieldLabel
                htmlFor="from"
                className="text-xs tracking-widest text-ink-body uppercase"
              >
                Dari
              </FieldLabel>
              <Input
                id="from"
                name="from"
                type="date"
                defaultValue={report.from}
                className="h-11 rounded-none border-rule-field bg-paper-tint px-4"
              />
            </Field>

            <Field className="w-44">
              <FieldLabel htmlFor="to" className="text-xs tracking-widest text-ink-body uppercase">
                Sampai
              </FieldLabel>
              <Input
                id="to"
                name="to"
                type="date"
                defaultValue={report.to}
                className="h-11 rounded-none border-rule-field bg-paper-tint px-4"
              />
            </Field>

            <Button
              type="submit"
              className="h-11 rounded-none bg-ink px-6 text-white hover:bg-ink/90 active:scale-95"
            >
              Tampilkan
            </Button>
          </div>
        )}
      </Form>

      <div className="grid gap-4 sm:grid-cols-3">
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

      <Card className="mt-6 rounded-none border border-rule bg-white">
        <CardHeader>
          <p className="text-xs font-medium tracking-widest text-ink-soft uppercase">
            Pendapatan Harian
          </p>
        </CardHeader>
        <CardContent>
          <ChartContainer config={chartConfig} className="h-64 w-full">
            <BarChart data={report.series} margin={{ left: 4, right: 4 }}>
              <CartesianGrid vertical={false} strokeDasharray="3 3" />
              <XAxis dataKey="label" tickLine={false} axisLine={false} tickMargin={8} />
              <YAxis hide />
              <ChartTooltip
                content={<ChartTooltipContent formatter={(value) => formatRupiah(Number(value))} />}
              />
              <Bar dataKey="total" fill="var(--color-total)" radius={4} />
            </BarChart>
          </ChartContainer>
        </CardContent>
      </Card>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <BreakdownTable title="Metode Pembayaran" rows={report.byPaymentMethod} />
        <BreakdownTable title="Tipe Pesanan" rows={report.byType} />
      </div>

      <Card className="mt-6 rounded-none border border-rule bg-white">
        <CardHeader>
          <p className="text-xs font-medium tracking-widest text-ink-soft uppercase">
            Layanan Terlaris
          </p>
        </CardHeader>
        <CardContent>
          {report.topServices.length === 0 ? (
            <p className="py-8 text-center text-sm text-ink-subtle">
              Belum ada layanan terjual pada rentang ini
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Layanan</TableHead>
                  <TableHead className="text-right">Terjual</TableHead>
                  <TableHead className="text-right">Pendapatan</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {report.topServices.map((service) => (
                  <TableRow key={service.id}>
                    <TableCell className="font-medium text-ink">{service.name}</TableCell>
                    <TableCell className="text-right">{service.orders}</TableCell>
                    <TableCell className="text-right font-semibold">
                      {formatRupiah(service.revenue)}
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
