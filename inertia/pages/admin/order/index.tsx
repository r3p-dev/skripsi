import AdminLayout from '@/components/layouts/admin_layout'
import { BoxSelect, SearchField, SolidButton, StatusBadge } from '@/components/atoms/editorial'
import { DataTable, type Column } from '@/components/molecules/data_table'
import { ExportButton } from '@/components/molecules/export_button'
import { PageHeader } from '@/components/molecules/page_header'
import { Pagination } from '@/components/molecules/pagination'
import { neutralTone, orderStatusTones, orderTypeTones } from '@/lib/constants'
import type { Data } from '@/generated/data'
import type { InertiaProps, Metadata } from '@/types'
import { Form, Link } from '@adonisjs/inertia/react'

type Option = { value: string; label: string }

type OrderRow = Data.Order.Variants['toListItem']

type PageProps = InertiaProps<{
  orders: { data: OrderRow[]; metadata: Metadata }
  filters: { search: string; page: number; status: string; type: string }
  statusOptions: Option[]
  typeOptions: Option[]
}>

const columns: Column<OrderRow>[] = [
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
    key: 'customer',
    header: 'Pelanggan',
    role: 'meta',
    cell: (order) => (
      <span className="text-ink-body">
        {order.customerName}
        <span className="text-ink-subtle"> · {order.customerPhone}</span>
      </span>
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
    key: 'type',
    header: 'Tipe',
    cell: (order) => (
      <StatusBadge tone={orderTypeTones[order.type] ?? neutralTone}>{order.typeLabel}</StatusBadge>
    ),
  },
  {
    key: 'createdAt',
    header: 'Dibuat',
    cellClassName: 'text-ink-soft',
    cell: (order) => order.createdAtLabel,
  },
  {
    key: 'totalPrice',
    header: 'Total',
    align: 'right',
    cellClassName: 'font-semibold text-ink',
    cell: (order) => order.totalPriceLabel ?? '-',
  },
]

export default function Index({ orders, filters, statusOptions, typeOptions }: PageProps) {
  return (
    <AdminLayout title="Pesanan" description="Pantau seluruh pesanan UmimaClean">
      <PageHeader
        eyebrow="Admin"
        title="Pemantauan Pesanan"
        description="Seluruh pesanan online dan offline"
        action={<ExportButton />}
      />

      <Form route="admin.order.index" className="mb-5">
        {() => (
          <div className="flex flex-col gap-2.5 tablet:flex-row tablet:flex-wrap tablet:items-center">
            <SearchField
              name="search"
              aria-label="Cari pesanan"
              defaultValue={filters.search}
              placeholder="Cari nomor, nama, atau telepon..."
              wrapperClassName="tablet:min-w-64 tablet:flex-1"
            />

            <BoxSelect
              name="status"
              aria-label="Status"
              defaultValue={filters.status}
              className="tablet:w-auto"
            >
              <option value="">Semua Status</option>
              {statusOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </BoxSelect>

            <BoxSelect
              name="type"
              aria-label="Tipe"
              defaultValue={filters.type}
              className="tablet:w-auto"
            >
              <option value="">Semua Tipe</option>
              {typeOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </BoxSelect>

            <SolidButton type="submit" className="py-3 tablet:w-auto tablet:px-8">
              Terapkan
            </SolidButton>
          </div>
        )}
      </Form>

      <DataTable
        columns={columns}
        rows={orders.data}
        getKey={(order) => order.id}
        empty="Tidak ada pesanan yang cocok dengan filter ini"
      />

      <Pagination metadata={orders.metadata} />
    </AdminLayout>
  )
}
