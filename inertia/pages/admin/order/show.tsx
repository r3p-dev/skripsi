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
import { DetailRow } from '@/components/molecules/detail_row'
import { PageHeader } from '@/components/molecules/page_header'
import { neutralTone, orderStatusTones, transactionStatusTones } from '@/lib/constants'
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
        {line.subtotalLabel}
      </span>
    ),
  },
]

const transactionColumns: Column<OrderTransaction>[] = [
  {
    key: 'method',
    header: 'Metode',
    role: 'primary',
    cell: (transaction) => transaction.paymentMethodLabel,
  },
  {
    key: 'createdAt',
    header: 'Tanggal',
    role: 'meta',
    cell: (transaction) => transaction.createdAt,
  },
  {
    key: 'status',
    header: 'Status',
    role: 'trailing',
    cell: (transaction) => (
      <StatusBadge tone={transactionStatusTones[transaction.status] ?? neutralTone}>
        {transaction.statusLabel}
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
        description={`${order.typeLabel} · dibuat ${order.createdAt}`}
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
              {order.statusLabel}
            </StatusBadge>
          </PanelHeader>
          <PanelBody className="py-1">
            <DetailRow label="Pelanggan" value={order.customerName} />
            <DetailRow label="Telepon" value={order.customerPhone} />
            <DetailRow label="Akun" value={order.user?.name ?? 'Tanpa akun (offline)'} />
            <DetailRow label="Jadwal Jemput" value={order.pickupDate ?? '—'} />
            <DetailRow label="Total" value={order.totalPriceLabel} />
          </PanelBody>
        </Panel>

        <Panel tone="tint" className="desktop:col-span-2">
          <PanelHeader>
            <SectionLabel>Alamat Penjemputan</SectionLabel>
          </PanelHeader>
          {order.address ? (
            <PanelBody className="py-1">
              <DetailRow label="Penerima" value={order.address.name} />
              <DetailRow label="Telepon" value={order.address.phone} />
              <DetailRow label="Alamat" value={order.address.street} />
              <DetailRow label="Catatan" value={order.address.note} />
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
                        {action.nameLabel ?? action.name}
                      </p>
                      <p className="m-0 text-meta text-ink-subtle">{action.createdAt}</p>
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
