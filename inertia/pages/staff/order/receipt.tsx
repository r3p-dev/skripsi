import {
  BackLink,
  Eyebrow,
  OutlineButton,
  PageTitle,
  Shell,
  SolidButton,
} from '@/components/atoms/editorial'
import type { Data } from '@/generated/data'
import type { InertiaProps } from '@/types'
import { OrderTypeLabel } from '@/enums/order_enum'
import { PaymentMethodLabel } from '@/enums/transaction_enum'
import { formatDateTime, formatRupiah } from '@/lib/format'
import { groupLinesByItem } from '@/lib/order'
import { Link } from '@adonisjs/inertia/react'
import { Head } from '@inertiajs/react'
import { IconPrinter } from '@tabler/icons-react'
import { type ReactNode } from 'react'

type PageProps = InertiaProps<{
  order: Data.Order.Variants['toDetail']
  change: number
}>

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex items-baseline gap-2">
      <span className="text-ink-soft">{label}</span>
      <span className="receipt-leader" />
      <span className="text-right font-semibold">{children}</span>
    </div>
  )
}

function Perforation() {
  return <div className="border-t border-dashed border-rule-field" />
}

function ReceiptCopy({
  order,
  change,
  copy,
}: {
  order: Data.Order.Variants['toDetail']
  change: number
  copy: string
}) {
  const transaction = order.transactions?.at(0)
  const itemGroups = groupLinesByItem(order.items ?? [])

  return (
    <div className="receipt-paper break-inside-avoid bg-white font-mono text-ink print:shadow-none">
      <div className="px-5 pt-6 pb-4 text-center">
        <img
          src="/images/logo.jpg"
          alt="Logo UmimaClean"
          width={40}
          height={40}
          className="mx-auto size-10"
        />
        <h2 className="m-0 mt-1.5 font-sans text-lead leading-[1.4] font-bold">UmimaClean</h2>
        <p className="m-0 text-badge tracking-[0.2em] text-ink-subtle uppercase">
          Layanan Cuci Sepatu
        </p>
        <p className="m-0 mt-2 text-badge tracking-[0.2em] text-ink-subtle uppercase">{copy}</p>
      </div>

      <Perforation />

      <div className="flex flex-col gap-3 px-5 py-5">
        <div className="text-center">
          <p className="m-0 text-badge tracking-[0.2em] text-ink-subtle uppercase">Nomor Pesanan</p>
          <p className="m-0 text-lead leading-[1.4] font-bold">{order.orderNumber}</p>
        </div>

        <div className="flex flex-col gap-1.5 text-meta leading-normal">
          <Row label="Pelanggan">{order.customerName}</Row>
          <Row label="Telepon">{order.customerPhone}</Row>
          <Row label="Tipe">{OrderTypeLabel[order.type as keyof typeof OrderTypeLabel]}</Row>
          <Row label="Waktu">{formatDateTime(order.createdAt)}</Row>
        </div>
      </div>

      <Perforation />

      <div className="flex flex-col gap-3 px-5 py-5">
        {itemGroups.map((group) => (
          <div key={group.key} className="flex flex-col gap-1">
            <p className="m-0 text-meta leading-normal font-semibold">{group.title}</p>
            {group.lines.map((line) => (
              <div key={line.id} className="flex items-baseline gap-2 text-meta leading-normal">
                <span className="text-ink-soft">{line.name}</span>
                <span className="receipt-leader" />
                <span className="tabular-nums whitespace-nowrap">
                  {formatRupiah(line.subtotal)}
                </span>
              </div>
            ))}
          </div>
        ))}
      </div>

      <Perforation />

      <div className="flex flex-col gap-1.5 px-5 py-5 text-meta leading-normal">
        <div className="flex items-baseline justify-between gap-3">
          <span className="tracking-[0.2em] uppercase">Total</span>
          <span className="text-lead leading-[1.4] font-bold tabular-nums">
            {formatRupiah(order.totalPrice ?? 0)}
          </span>
        </div>

        {transaction && (
          <Row label="Metode">
            {PaymentMethodLabel[transaction.paymentMethod as keyof typeof PaymentMethodLabel]}
          </Row>
        )}

        {transaction?.cashReceived !== null && transaction?.cashReceived !== undefined && (
          <>
            <Row label="Tunai">{formatRupiah(transaction.cashReceived)}</Row>
            <Row label="Kembalian">{formatRupiah(change)}</Row>
          </>
        )}
      </div>

      <Perforation />

      <div className="px-5 pt-4 pb-7 text-center">
        <p className="m-0 text-badge tracking-[0.2em] text-ink-subtle uppercase">Terima Kasih</p>
      </div>
    </div>
  )
}

export default function Receipt({ order, change }: PageProps) {
  return (
    <div className="min-h-dvh bg-paper print:bg-white">
      <Head>
        <title>{`Struk ${order.orderNumber}`}</title>
        <meta name="description" content="Struk pesanan konter UmimaClean" />
      </Head>

      <Shell className="flex flex-col bg-paper-tint print:max-w-none print:bg-white">
        <header className="gutter pt-6 print:hidden">
          <BackLink route="staff.trip.index">← Antrean Tugas</BackLink>
        </header>

        <div className="gutter pt-7 pb-6 print:hidden">
          <Eyebrow className="mb-1.5">Konter</Eyebrow>
          <PageTitle>Struk Pesanan</PageTitle>
        </div>

        <div className="gutter flex flex-1 flex-col gap-5 pb-page print:gap-0 print:p-0">
          <ReceiptCopy order={order} change={change} copy="Salinan Pelanggan" />
          <ReceiptCopy order={order} change={change} copy="Salinan Toko — Tempel di Barang" />

          <OutlineButton
            type="button"
            onClick={() => window.print()}
            className="gap-2 bg-white print:hidden"
          >
            <IconPrinter className="size-5" />
            Cetak 2 Struk
          </OutlineButton>

          <Link route="staff.trip.index" className="block print:hidden">
            <SolidButton render={<span />}>Selesai</SolidButton>
          </Link>
        </div>
      </Shell>
    </div>
  )
}
