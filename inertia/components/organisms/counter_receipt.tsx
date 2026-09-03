import { ReceiptPerforation, ReceiptRow } from '@/components/molecules/receipt'
import type { Data } from '@/generated/data'
import { groupLinesByItem } from '@/lib/order'

export function ReceiptCopy({
  order,
  changeLabel,
  copy,
}: {
  order: Data.Order.Variants['toDetail']
  changeLabel: string
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

      <ReceiptPerforation />

      <div className="flex flex-col gap-3 px-5 py-5">
        <div className="text-center">
          <p className="m-0 text-badge tracking-[0.2em] text-ink-subtle uppercase">Nomor Pesanan</p>
          <p className="m-0 text-lead leading-[1.4] font-bold">{order.orderNumber}</p>
        </div>

        <div className="flex flex-col gap-1.5 text-meta leading-normal">
          <ReceiptRow label="Pelanggan">{order.customerName}</ReceiptRow>
          <ReceiptRow label="Telepon">{order.customerPhone}</ReceiptRow>
          <ReceiptRow label="Tipe">{order.typeLabel}</ReceiptRow>
          <ReceiptRow label="Waktu">{order.createdAt}</ReceiptRow>
        </div>
      </div>

      <ReceiptPerforation />

      <div className="flex flex-col gap-3 px-5 py-5">
        {itemGroups.map((group) => (
          <div key={group.key} className="flex flex-col gap-1">
            <p className="m-0 text-meta leading-normal font-semibold">{group.title}</p>
            {group.lines.map((line) => (
              <div key={line.id} className="flex items-baseline gap-2 text-meta leading-normal">
                <span className="text-ink-soft">{line.name}</span>
                <span className="receipt-leader" />
                <span className="tabular-nums whitespace-nowrap">{line.subtotalLabel}</span>
              </div>
            ))}
          </div>
        ))}
      </div>

      <ReceiptPerforation />

      <div className="flex flex-col gap-1.5 px-5 py-5 text-meta leading-normal">
        <div className="flex items-baseline justify-between gap-3">
          <span className="tracking-[0.2em] uppercase">Total</span>
          <span className="text-lead leading-[1.4] font-bold tabular-nums">
            {order.totalPriceLabel}
          </span>
        </div>

        {transaction && <ReceiptRow label="Metode">{transaction.paymentMethodLabel}</ReceiptRow>}

        {transaction?.cashReceived !== null && transaction?.cashReceived !== undefined && (
          <>
            <ReceiptRow label="Tunai">{transaction.cashReceivedLabel}</ReceiptRow>
            <ReceiptRow label="Kembalian">{changeLabel}</ReceiptRow>
          </>
        )}
      </div>

      <ReceiptPerforation />

      <div className="px-5 pt-4 pb-7 text-center">
        <p className="m-0 text-badge tracking-[0.2em] text-ink-subtle uppercase">Terima Kasih</p>
      </div>
    </div>
  )
}
