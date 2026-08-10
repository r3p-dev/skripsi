import { buttonVariants } from '@/components/ui/button'
import type { Data } from '@/generated/data'
import type { InertiaProps } from '@/types'
import { Link } from '@adonisjs/inertia/react'
import { Head } from '@inertiajs/react'
import { IconArrowLeft, IconPrinter } from '@tabler/icons-react'
import { OrderStatusLabel } from '@/enums/order_enum'
import { formatDate, formatRupiah } from '@/lib/format'
import { groupLinesByItem } from '@/lib/order'
import { type ReactNode } from 'react'

type PageProps = InertiaProps<{
  order: Data.Order.Variants['toDetail']
}>

export default function Receipt({ order }: PageProps) {
  const itemGroups = groupLinesByItem(order.items ?? [])

  return (
    <div className="mx-auto flex min-h-dvh max-w-md flex-col bg-paper-tint print:bg-white">
      <Head>
        <title>{`Struk ${order.orderNumber}`}</title>
        <meta name="description" content="Struk pesanan UmimaClean Anda" />
      </Head>

      <div className="flex items-center gap-3 px-6 py-5 print:hidden">
        <Link
          route="customer.order.show"
          routeParams={{ number: order.orderNumber }}
          className="flex size-11 shrink-0 items-center justify-center rounded-full border border-rule-field bg-white text-ink transition-colors hover:bg-paper-tint active:scale-95"
        >
          <IconArrowLeft className="size-5" />
        </Link>
        <div>
          <p className="text-xs tracking-[0.3em] text-ink-soft uppercase font-medium">Pesanan</p>
          <h1 className="text-2xl font-bold tracking-tight text-ink">Struk Pesanan</h1>
        </div>
      </div>

      <div className="flex-1 px-6 pb-page">
        <div className="receipt-paper bg-white font-mono text-ink shadow-sm print:shadow-none">
          <div className="relative bg-ink px-6 pt-8 pb-6 text-center text-white">
            <div
              className="absolute inset-0 opacity-5"
              style={{
                backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)',
                backgroundSize: '32px 32px',
              }}
            />
            <div className="relative space-y-1">
              <img
                src="/images/logo.jpg"
                alt="Logo UmimaClean"
                width={48}
                height={48}
                className="mx-auto size-12"
              />
              <h2 className="font-sans text-xl font-bold tracking-tight">UmimaClean</h2>
              <p className="text-[10px] tracking-[0.2em] text-white/70 uppercase">
                Layanan Cuci Sepatu
              </p>
              <p className="text-[10px] tracking-wide text-white/60">Bandung Raya</p>
            </div>
          </div>

          <div className="space-y-4 px-6 py-6">
            <div className="text-center">
              <p className="text-[10px] tracking-[0.2em] text-ink-subtle uppercase">
                Nomor Pesanan
              </p>
              <p className="text-lg font-bold tracking-tight">{order.orderNumber}</p>
            </div>

            <div className="flex flex-col gap-1.5 text-xs">
              <Row label="Status">
                {OrderStatusLabel[order.status as keyof typeof OrderStatusLabel]}
              </Row>
              <Row label="Tgl. Pemesanan">{formatDate(order.createdAt)}</Row>
              <Row label="Tgl. Penjemputan">{formatDate(order.pickupDate)}</Row>
            </div>
          </div>

          <Perforation />

          <div className="space-y-1 px-6 py-6 text-xs">
            <p className="text-[10px] tracking-[0.2em] text-ink-subtle uppercase">Penerima</p>
            <p className="font-semibold">{order.customerName}</p>
            <p className="text-ink-soft">{order.customerPhone}</p>
            {order.address && (
              <p className="leading-relaxed text-ink-soft">{order.address.street}</p>
            )}
          </div>

          {itemGroups.length > 0 && (
            <>
              <Perforation />

              <div className="space-y-4 px-6 py-6">
                <p className="text-[10px] tracking-[0.2em] text-ink-subtle uppercase">Rincian</p>

                {itemGroups.map((group) => (
                  <div key={group.key} className="space-y-1">
                    <p className="text-xs font-semibold">{group.title}</p>
                    {group.lines.map((line) => (
                      <div key={line.id} className="flex items-baseline gap-2 text-xs">
                        <span className="text-ink-soft">{line.service?.name ?? line.name}</span>
                        <span className="receipt-leader" />
                        <span className="whitespace-nowrap tabular-nums">
                          {formatRupiah(line.subtotal)}
                        </span>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </>
          )}

          <Perforation />

          <div className="flex items-baseline justify-between px-6 py-6">
            <span className="text-xs tracking-[0.2em] uppercase">Total</span>
            <span className="text-lg font-bold tracking-tight tabular-nums">
              {order.totalPrice === null ? 'Belum ada tagihan' : formatRupiah(order.totalPrice)}
            </span>
          </div>

          <Perforation />

          <div className="space-y-1 px-6 pt-6 pb-8 text-center">
            <p className="text-[10px] tracking-[0.2em] text-ink-subtle uppercase">Terima Kasih</p>
            <p className="text-[10px] leading-relaxed text-ink-subtle">
              Simpan struk ini sebagai bukti pesanan Anda
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => window.print()}
          className={buttonVariants({
            variant: 'outline',
            className:
              'mt-6 h-12 w-full rounded-none bg-white text-base font-semibold tracking-wide text-ink active:scale-95 print:hidden',
          })}
        >
          <IconPrinter className="size-5" />
          Cetak Struk
        </button>
      </div>
    </div>
  )
}

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
