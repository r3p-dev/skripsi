import { buttonVariants } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import type { Data } from '@/generated/data'
import type { InertiaProps } from '@/types'
import { OrderTypeLabel } from '@/enums/order_type_enum'
import { PaymentMethodLabel } from '@/enums/transaction_enum'
import { formatDateTime, formatRupiah } from '@/lib/format'
import { Link } from '@adonisjs/inertia/react'
import { Head } from '@inertiajs/react'
import { IconArrowLeft, IconPrinter } from '@tabler/icons-react'

type PageProps = InertiaProps<{
  order: Data.Order.Variants['toDetail']
  change: number
}>

/**
 * One copy of the counter receipt.
 *
 * Rendered twice on the page, with a label saying which is which. One goes
 * home with the customer and one is stapled to the shoes, so the batch on the
 * rack can be matched to the person coming back for it without anyone looking
 * it up. Printing the page twice would do the same job, and would also mean
 * two trips to the printer with a queue at the counter.
 */
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

  return (
    <Card className="gap-0 break-inside-avoid rounded-2xl border border-gray-300 p-0">
      <div className="border-b border-dashed border-gray-300 px-5 py-4 text-center">
        <img src="/images/logo.jpg" alt="UmimaClean" className="mx-auto size-10" />
        <h2 className="text-lg font-bold tracking-tight text-black">UmimaClean</h2>
        <p className="text-[10px] tracking-widest text-gray-500">{copy}</p>
      </div>

      <div className="space-y-3 border-b border-dashed border-gray-300 p-5">
        <div className="text-center">
          <p className="text-xs tracking-widest text-gray-500 uppercase">Nomor Pesanan</p>
          <p className="text-lg font-bold tracking-tight text-black">{order.orderNumber}</p>
        </div>

        <div className="flex flex-col gap-1.5 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-gray-600">Pelanggan</span>
            <span className="font-semibold text-black">{order.customerName}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-gray-600">Telepon</span>
            <span className="font-semibold text-black">{order.customerPhone}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-gray-600">Tipe</span>
            <span className="font-semibold text-black">
              {OrderTypeLabel[order.type as keyof typeof OrderTypeLabel]}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-gray-600">Waktu</span>
            <span className="font-semibold text-black">{formatDateTime(order.createdAt)}</span>
          </div>
        </div>
      </div>

      <div className="border-b border-dashed border-gray-300 p-5">
        <div className="divide-y divide-gray-200">
          {(order.items ?? []).map((item) => (
            <div key={item.id} className="flex items-start justify-between gap-3 py-2 text-sm">
              <span className="text-gray-700">{item.name}</span>
              <span className="shrink-0 font-medium text-black">{formatRupiah(item.subtotal)}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-1.5 p-5 text-sm">
        <div className="flex items-center justify-between">
          <span className="tracking-widest text-gray-600 uppercase">Total</span>
          <span className="text-lg font-bold tracking-tight text-black">
            {formatRupiah(order.totalPrice ?? 0)}
          </span>
        </div>

        {transaction && (
          <div className="flex items-center justify-between">
            <span className="text-gray-600">Metode</span>
            <span className="font-semibold text-black">
              {PaymentMethodLabel[transaction.paymentMethod as keyof typeof PaymentMethodLabel]}
            </span>
          </div>
        )}

        {/*
          Only cash has anything to say here. A debit or QRIS payment is always
          for the exact amount, so there is no change and printing a zero would
          only invite the question.
        */}
        {transaction?.cashReceived !== null && transaction?.cashReceived !== undefined && (
          <>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Tunai</span>
              <span className="font-semibold text-black">
                {formatRupiah(transaction.cashReceived)}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Kembalian</span>
              <span className="font-bold text-black">{formatRupiah(change)}</span>
            </div>
          </>
        )}
      </div>
    </Card>
  )
}

export default function Receipt({ order, change }: PageProps) {
  return (
    <div className="mx-auto flex min-h-dvh max-w-md flex-col bg-white">
      <Head>
        <title>{`Struk ${order.orderNumber}`}</title>
        <meta name="description" content="Struk pesanan konter UmimaClean" />
      </Head>

      <div className="flex items-center gap-3 px-6 py-5 print:hidden">
        <Link
          route="staff.trip.index"
          className="flex size-11 shrink-0 items-center justify-center rounded-full border border-gray-300 text-black transition-colors hover:bg-gray-100 active:scale-95"
        >
          <IconArrowLeft className="size-5" />
        </Link>
        <div>
          <p className="text-xs tracking-[0.3em] text-gray-600 uppercase font-medium">Konter</p>
          <h1 className="text-2xl font-bold tracking-tight text-black">Struk Pesanan</h1>
        </div>
      </div>

      <div className="flex-1 space-y-4 px-6 pb-page">
        <ReceiptCopy order={order} change={change} copy="Salinan Pelanggan" />
        <ReceiptCopy order={order} change={change} copy="Salinan Toko — Tempel di Barang" />

        <button
          type="button"
          onClick={() => window.print()}
          className={buttonVariants({
            variant: 'outline',
            className:
              'h-12 w-full rounded-xl text-base font-semibold tracking-wide text-black active:scale-95 print:hidden',
          })}
        >
          <IconPrinter className="size-5" />
          Cetak 2 Struk
        </button>

        <Link
          route="staff.trip.index"
          className={buttonVariants({
            className:
              'h-12 w-full rounded-xl bg-black text-base font-semibold tracking-wide text-white hover:bg-black/90 active:scale-95 print:hidden',
          })}
        >
          Selesai
        </Link>
      </div>
    </div>
  )
}
