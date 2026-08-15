import { BackLink, Eyebrow, OutlineButton, PageTitle, Shell } from '@/components/atoms/editorial'
import type { Data } from '@/generated/data'
import type { InertiaProps } from '@/types'
import { Head } from '@inertiajs/react'
import { IconPrinter } from '@tabler/icons-react'
import { OrderStatusLabel } from '@/enums/order_enum'
import { formatDate } from '@/lib/format'
import { groupLinesByItem } from '@/lib/order'
import { type ReactNode } from 'react'

type PageProps = InertiaProps<{
  order: Data.Order.Variants['toDetail']
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

export default function Receipt({ order }: PageProps) {
  const itemGroups = groupLinesByItem(order.items ?? [])

  return (
    <div className="min-h-dvh bg-paper print:bg-white">
      <Head>
        <title>{`Struk ${order.orderNumber}`}</title>
        <meta name="description" content="Struk pesanan UmimaClean Anda" />
      </Head>

      <Shell className="flex flex-col bg-paper-tint print:max-w-none print:bg-white">
        <header className="gutter pt-6 print:hidden">
          <BackLink route="customer.orders.show" routeParams={{ number: order.orderNumber }}>
            ← Detail Pesanan
          </BackLink>
        </header>

        <div className="gutter pt-7 pb-6 print:hidden">
          <Eyebrow className="mb-1.5">Pesanan</Eyebrow>
          <PageTitle>Struk Pesanan</PageTitle>
        </div>

        <div className="gutter flex-1 pb-page print:p-0">
          <div className="receipt-paper bg-white font-mono text-ink print:shadow-none">
            <div className="relative overflow-hidden bg-ink px-6 pt-8 pb-6 text-center text-white">
              <div
                className="absolute inset-0 opacity-5"
                style={{
                  backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)',
                  backgroundSize: '32px 32px',
                }}
              />
              <div className="relative">
                <img
                  src="/images/logo.jpg"
                  alt="Logo UmimaClean"
                  width={48}
                  height={48}
                  className="mx-auto size-12"
                />
                <h2 className="m-0 mt-2 font-sans text-title leading-[1.2] font-bold">
                  UmimaClean
                </h2>
                <p className="m-0 mt-1 text-badge tracking-[0.2em] text-white/70 uppercase">
                  Layanan Cuci Sepatu
                </p>
                <p className="m-0 text-badge tracking-[0.04em] text-white/60">Bandung Raya</p>
              </div>
            </div>

            <div className="flex flex-col gap-4 px-6 py-6">
              <div className="text-center">
                <p className="m-0 text-badge tracking-[0.2em] text-ink-subtle uppercase">
                  Nomor Pesanan
                </p>
                <p className="m-0 text-lead leading-[1.4] font-bold">{order.orderNumber}</p>
              </div>

              <div className="flex flex-col gap-1.5 text-meta leading-normal">
                <Row label="Status">
                  {OrderStatusLabel[order.status as keyof typeof OrderStatusLabel]}
                </Row>
                <Row label="Tgl. Pemesanan">{formatDate(order.createdAt)}</Row>
                <Row label="Tgl. Penjemputan">{formatDate(order.pickupDate)}</Row>
              </div>
            </div>

            <Perforation />

            <div className="px-6 py-6 text-meta leading-normal">
              <p className="m-0 text-badge tracking-[0.2em] text-ink-subtle uppercase">Penerima</p>
              <p className="m-0 mt-1 font-semibold">{order.customerName}</p>
              <p className="m-0 text-ink-soft">{order.customerPhone}</p>
              {order.address && (
                <p className="m-0 leading-[1.6] text-ink-soft">{order.address.street}</p>
              )}
            </div>

            {itemGroups.length > 0 && (
              <>
                <Perforation />

                <div className="flex flex-col gap-4 px-6 py-6">
                  <p className="m-0 text-badge tracking-[0.2em] text-ink-subtle uppercase">
                    Rincian
                  </p>

                  {itemGroups.map((group) => (
                    <div key={group.key} className="flex flex-col gap-1">
                      <p className="m-0 text-meta leading-normal font-semibold">{group.title}</p>
                      {group.lines.length === 0 && (
                        <p className="m-0 text-meta leading-normal text-ink-subtle">
                          Layanan ditentukan setelah barang diperiksa petugas.
                        </p>
                      )}
                      {group.lines.map((line) => (
                        <div
                          key={line.id}
                          className="flex items-baseline gap-2 text-meta leading-normal"
                        >
                          <span className="text-ink-soft">{line.name}</span>
                          <span className="receipt-leader" />
                          <span className="tabular-nums whitespace-nowrap">
                            {line.subtotalLabel}
                          </span>
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              </>
            )}

            <Perforation />

            <div className="flex items-baseline justify-between gap-3 px-6 py-6">
              <span className="text-meta tracking-[0.2em] uppercase">Total</span>
              <span className="text-lead leading-[1.4] font-bold tabular-nums">
                {order.totalPrice === 0 ? 'Belum ada tagihan' : order.totalPriceLabel}
              </span>
            </div>

            <Perforation />

            <div className="px-6 pt-6 pb-8 text-center">
              <p className="m-0 text-badge tracking-[0.2em] text-ink-subtle uppercase">
                Terima Kasih
              </p>
              <p className="m-0 mt-1 text-badge leading-[1.6] text-ink-subtle">
                Simpan struk ini sebagai bukti pesanan Anda
              </p>
            </div>
          </div>

          <OutlineButton
            type="button"
            onClick={() => window.print()}
            className="mt-6 gap-2 bg-white print:hidden"
          >
            <IconPrinter className="size-5" />
            Cetak Struk
          </OutlineButton>
        </div>
      </Shell>
    </div>
  )
}
