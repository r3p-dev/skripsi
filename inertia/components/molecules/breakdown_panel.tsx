import { Panel, PanelHeader, SectionLabel } from '@/components/atoms/editorial'
import { DataTable, type Column } from '@/components/molecules/data_table'

export type MoneyBreakdown = {
  value: string
  label: string
  orders: number
  revenue: number
  revenueLabel: string
}

const breakdownColumns: Column<MoneyBreakdown>[] = [
  { key: 'label', header: 'Nama', role: 'primary', cell: (row) => row.label },
  {
    key: 'revenue',
    header: 'Pendapatan',
    align: 'right',
    role: 'trailing',
    cell: (row) => (
      <span className="text-body font-semibold text-ink tablet:text-small">{row.revenueLabel}</span>
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

export function BreakdownPanel({ title, rows }: { title: string; rows: MoneyBreakdown[] }) {
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
