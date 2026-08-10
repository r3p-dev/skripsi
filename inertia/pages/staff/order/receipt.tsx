import { buttonVariants } from '@/components/ui/button'
import type { Data } from '@/generated/data'
import type { InertiaProps } from '@/types'
import { OrderTypeLabel } from '@/enums/order_enum'
import { PaymentMethodLabel } from '@/enums/transaction_enum'
import { formatDateTime, formatRupiah } from '@/lib/format'
import { groupLinesByItem } from '@/lib/order'
import { Link } from '@adonisjs/inertia/react'
import { Head } from '@inertiajs/react'
import { IconArrowLeft, IconPrinter } from '@tabler/icons-react'
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
    <div className="receipt-paper break-inside-avoid bg-white font-mono text-ink shadow-sm print:shadow-none">
      <div className="px-5 pt-6 pb-4 text-center">
        <img
          src="/images/logo.jpg"
          alt="Logo UmimaClean"
          width={40}
          height={40}
          className="mx-auto size-10"
        />
        <h2 className="font-sans text-lg font-bold tracking-tight">UmimaClean</h2>
        <p className="text-[10px] tracking-[0.2em] text-ink-subtle uppercase">
          Layanan Cuci Sepatu
        </p>
        <p className="mt-2 text-[10px] tracking-[0.2em] text-ink-subtle uppercase">{copy}</p>
      </div>

      <Perforation />

      <div className="space-y-3 px-5 py-5">
        <div className="text-center">
          <p className="text-[10px] tracking-[0.2em] text-ink-subtle uppercase">Nomor Pesanan</p>
          <p className="text-lg font-bold tracking-tight">{order.orderNumber}</p>
        </div>

        <div className="flex flex-col gap-1.5 text-xs">
          <Row label="Pelanggan">{order.customerName}</Row>
          <Row label="Telepon">{order.customerPhone}</Row>
          <Row label="Tipe">{OrderTypeLabel[order.type as keyof typeof OrderTypeLabel]}</Row>
          <Row label="Waktu">{formatDateTime(order.createdAt)}</Row>
        </div>
      </div>

      <Perforation />

      <div className="space-y-3 px-5 py-5">
        {itemGroups.map((group) => (
          <div key={group.key} className="space-y-1">
            <p className="text-xs font-semibold">{group.title}</p>
            {group.lines.map((line) => (
              <div key={line.id} className="flex items-baseline gap-2 text-xs">
                <span className="text-ink-soft">{line.service?.name ?? line.name}</span>
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

      <div className="space-y-1.5 px-5 py-5 text-xs">
        <div className="flex items-baseline justify-between">
          <span className="tracking-[0.2em] uppercase">Total</span>
          <span className="text-lg font-bold tracking-tight tabular-nums">
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
        <p className="text-[10px] tracking-[0.2em] text-ink-subtle uppercase">Terima Kasih</p>
      </div>
    </div>
  )
}

export default function Receipt({ order, change }: PageProps) {
  return (
    <div className="mx-auto flex min-h-dvh max-w-md flex-col bg-paper-tint print:bg-white">
      <Head>
        <title>{`Struk ${order.orderNumber}`}</title>
        <meta name="description" content="Struk pesanan konter UmimaClean" />
      </Head>

      <div className="flex items-center gap-3 px-6 py-5 print:hidden">
        <Link
          route="staff.trip.index"
          className="flex size-11 shrink-0 items-center justify-center rounded-full border border-rule-field bg-white text-ink transition-colors hover:bg-paper-tint active:scale-95"
        >
          <IconArrowLeft className="size-5" />
        </Link>
        <div>
          <p className="text-xs tracking-[0.3em] text-ink-soft uppercase font-medium">Konter</p>
          <h1 className="text-2xl font-bold tracking-tight text-ink">Struk Pesanan</h1>
        </div>
      </div>

      <div className="flex-1 space-y-5 px-6 pb-page">
        <ReceiptCopy order={order} change={change} copy="Salinan Pelanggan" />
        <ReceiptCopy order={order} change={change} copy="Salinan Toko — Tempel di Barang" />

        <button
          type="button"
          onClick={() => window.print()}
          className={buttonVariants({
            variant: 'outline',
            className:
              'h-12 w-full rounded-none bg-white text-base font-semibold tracking-wide text-ink active:scale-95 print:hidden',
          })}
        >
          <IconPrinter className="size-5" />
          Cetak 2 Struk
        </button>

        <Link
          route="staff.trip.index"
          className={buttonVariants({
            className:
              'h-12 w-full rounded-none bg-ink text-base font-semibold tracking-wide text-white hover:bg-ink/90 active:scale-95 print:hidden',
          })}
        >
          Selesai
        </Link>
      </div>
    </div>
  )
}
