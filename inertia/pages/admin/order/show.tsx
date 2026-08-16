import { OrderStatusLabel, OrderTypeLabel } from '@/enums/order_enum'
import AdminLayout from '@/components/layouts/admin_layout'
import {
  EmptyState,
  Panel,
  PanelBody,
  PanelHeader,
  SectionLabel,
  StatusBadge,
} from '@/components/atoms/editorial'
import { DataTable, type Column } from '@/components/molecules/data_table'
import { PageHeader } from '@/components/molecules/page_header'
import { neutralTone, orderStatusTones, transactionStatusTones } from '@/lib/constants'
import { ActionNameLabel } from '@/enums/order_action_enum'
import { PaymentMethodLabel, TransactionStatusLabel } from '@/enums/transaction_enum'
import { formatDate, formatDateTime, formatRupiah } from '@/lib/format'
import type { Data } from '@/generated/data'
import type { InertiaProps } from '@/types'
import { Link } from '@adonisjs/inertia/react'
import { IconArrowLeft } from '@tabler/icons-react'

type OrderDetail = Data.Order.Variants['toDetail']
type OrderLine = NonNullable<OrderDetail['items']>[number]
type OrderTransaction = NonNullable<OrderDetail['transactions']>[number]

type PageProps = InertiaProps<{
  order: OrderDetail
}>

function Detail({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-0.5 border-b border-rule py-3 last:border-b-0">
      <p className="m-0 text-micro tracking-[0.14em] text-ink-subtle uppercase">{label}</p>
      <p className="m-0 text-small leading-normal font-medium text-ink">{value ?? '-'}</p>
    </div>
  )
}

const itemColumns: Column<OrderLine>[] = [
  {
    key: 'item',
    header: 'Barang',
    role: 'primary',
    cell: (line) => [line.typeLabel, line.brand, line.model].filter(Boolean).join(' '),
  },
  {
    key: 'catalogue',
    header: 'Layanan',
    role: 'meta',
    cell: (line) =>
      line.catalogues?.length
        ? line.catalogues.map((catalogue) => catalogue.name).join(', ')
        : 'Belum diinspeksi',
  },
  {
    key: 'subtotal',
    header: 'Harga',
    align: 'right',
    role: 'trailing',
    cell: (line) => (
      <span className="text-body font-semibold text-ink tablet:text-small">
        {formatRupiah(line.subtotal)}
      </span>
    ),
  },
]

const transactionColumns: Column<OrderTransaction>[] = [
  {
    key: 'method',
    header: 'Metode',
    role: 'primary',
    cell: (transaction) =>
      PaymentMethodLabel[transaction.paymentMethod as keyof typeof PaymentMethodLabel],
  },
  {
    key: 'createdAt',
    header: 'Tanggal',
    role: 'meta',
    cell: (transaction) => formatDateTime(transaction.createdAt),
  },
  {
    key: 'status',
    header: 'Status',
    role: 'trailing',
    cell: (transaction) => (
      <StatusBadge tone={transactionStatusTones[transaction.status] ?? neutralTone}>
        {TransactionStatusLabel[transaction.status as keyof typeof TransactionStatusLabel]}
      </StatusBadge>
    ),
  },
]

export default function Show({ order }: PageProps) {
  const items = order.items ?? []
  const actions = order.actions ?? []
  const transactions = order.transactions ?? []

  return (
    <AdminLayout title={order.orderNumber} description="Detail pesanan UmimaClean">
      <PageHeader
        eyebrow="Pesanan"
        title={order.orderNumber}
        description={`${OrderTypeLabel[order.type as keyof typeof OrderTypeLabel]} · dibuat ${formatDate(order.createdAt)}`}
        action={
          <Link
            route="admin.order.index"
            className="flex min-h-11 items-center gap-2 border border-rule-field px-4 text-meta font-medium tracking-[0.04em] text-ink transition-colors hover:bg-paper-tint"
          >
            <IconArrowLeft className="size-4" />
            Kembali
          </Link>
        }
      />

      <div className="grid gap-3 desktop:grid-cols-3">
        <Panel tone="tint">
          <PanelHeader>
            <SectionLabel>Ringkasan</SectionLabel>
            <StatusBadge tone={orderStatusTones[order.status] ?? neutralTone}>
              {OrderStatusLabel[order.status as keyof typeof OrderStatusLabel]}
            </StatusBadge>
          </PanelHeader>
          <PanelBody className="py-1">
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
          </PanelBody>
        </Panel>

        <Panel tone="tint" className="desktop:col-span-2">
          <PanelHeader>
            <SectionLabel>Alamat Penjemputan</SectionLabel>
          </PanelHeader>
          {order.address ? (
            <PanelBody className="py-1">
              <Detail label="Penerima" value={order.address.name} />
              <Detail label="Telepon" value={order.address.phone} />
              <Detail label="Alamat" value={order.address.street} />
              <Detail label="Catatan" value={order.address.note} />
            </PanelBody>
          ) : (
            <EmptyState>
              Pesanan offline — barang diantar langsung ke toko dan diambil di konter.
            </EmptyState>
          )}
        </Panel>
      </div>

      <div className="mt-4">
        <Panel className="border-b-0">
          <PanelHeader>
            <SectionLabel>Rincian Barang</SectionLabel>
          </PanelHeader>
        </Panel>
        <DataTable
          columns={itemColumns}
          rows={items}
          getKey={(line) => line.id}
          empty="Barang belum diinspeksi, sehingga belum ada rincian harga"
        />
      </div>

      <div className="mt-4 grid gap-3 desktop:grid-cols-2">
        <div>
          <Panel className="border-b-0">
            <PanelHeader>
              <SectionLabel>Transaksi</SectionLabel>
            </PanelHeader>
          </Panel>
          <DataTable
            columns={transactionColumns}
            rows={transactions}
            getKey={(transaction) => transaction.id}
            empty="Belum ada transaksi"
          />
        </div>

        <Panel>
          <PanelHeader>
            <SectionLabel>Riwayat Tindakan</SectionLabel>
          </PanelHeader>
          {actions.length === 0 ? (
            <EmptyState>Belum ada tindakan</EmptyState>
          ) : (
            <PanelBody className="py-0">
              <ul className="m-0 flex list-none flex-col p-0">
                {actions.map((action) => (
                  <li key={action.id} className="border-b border-rule py-3.5 last:border-b-0">
                    <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5">
                      <p className="m-0 text-small leading-normal font-medium text-ink">
                        {ActionNameLabel[action.name as keyof typeof ActionNameLabel] ??
                          action.name}
                      </p>
                      <p className="m-0 text-meta text-ink-subtle">
                        {formatDateTime(action.createdAt)}
                      </p>
                    </div>
                    <p className="m-0 mt-0.5 text-meta leading-normal text-ink-soft">
                      oleh {action.staff?.name ?? 'petugas tidak diketahui'}
                    </p>
                    {action.note && (
                      <p className="m-0 mt-1 text-meta leading-normal text-ink-soft">
                        {action.note}
                      </p>
                    )}
                  </li>
                ))}
              </ul>
            </PanelBody>
          )}
        </Panel>
      </div>
    </AdminLayout>
  )
}
