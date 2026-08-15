import {
  BackLink,
  Eyebrow,
  PageTitle,
  SolidButton,
  StatusBadge,
} from '@/components/atoms/editorial'
import CustomerLayout from '@/components/layouts/customer_layout'
import { ConfirmDialog, ConfirmFooter } from '@/components/molecules/confirm_action'
import type { Data } from '@/generated/data'
import type { InertiaProps } from '@/types'
import { Form, Link } from '@adonisjs/inertia/react'

type PageProps = InertiaProps<{
  order: Data.Order.Variants['toDetail']
  canCancel: boolean
  canPay: boolean
}>

export default function Show({ order, canCancel, canPay }: PageProps) {
  const items = order.items ?? []

  return (
    <CustomerLayout title={order.orderNumber} description="Detail pesanan UmimaClean Anda">
      <header className="gutter pt-6">
        <BackLink route="customer.orders.index">← Riwayat Pesanan</BackLink>
      </header>

      <div className="flex-1 pb-nav desktop:pb-page">
        <div className="gutter flex items-start justify-between gap-3 pt-7 pb-2">
          <div>
            <PageTitle className="mb-1.5">{order.orderNumber}</PageTitle>
            <div className="text-small leading-[1.6] text-ink-muted">{order.createdAt}</div>
          </div>
          <StatusBadge emphasis={order.isCompleted}>{order.statusLabel}</StatusBadge>
        </div>

        <section className="gutter pt-6">
          <Eyebrow className="mb-2">Tanggal Penjemputan</Eyebrow>
          <div className="text-body leading-[1.6] text-ink-body">
            {order.pickupDate ?? 'Belum dijadwalkan'}
          </div>
        </section>

        <section className="gutter pt-6">
          <Eyebrow className="mb-2">Alamat Penjemputan</Eyebrow>
          <div className="text-body leading-[1.6] text-ink-body">
            {order.address?.street ?? 'Alamat tidak tersedia'}
          </div>
        </section>

        <section className="gutter pt-6">
          <Eyebrow className="mb-4">Barang</Eyebrow>

          {items.map((item, index) => (
            <div key={item.id} className="border-t border-rule py-4">
              <div className="text-body leading-[1.4] font-semibold text-ink">
                Barang #{index + 1}: {item.typeLabel} — {item.brand} {item.model}
              </div>
              <div className="mt-0.5 mb-3 text-small leading-normal text-ink-subtle">
                Bahan: {item.material ?? '—'} · Ukuran: {item.size}
              </div>

              {(item.services ?? []).map((service) => (
                <div key={service.id} className="flex justify-between gap-3 py-1.5">
                  <span className="text-small leading-normal text-ink-body">— {service.name}</span>
                  <span className="text-small leading-normal whitespace-nowrap text-ink-body">
                    {service.priceLabel}
                  </span>
                </div>
              ))}

              {(item.services ?? []).length === 0 ? (
                <div className="text-small leading-normal text-ink-subtle">
                  Layanan ditentukan setelah barang diperiksa petugas.
                </div>
              ) : (
                <div className="mt-1.5 flex justify-between gap-3 border-t border-black/6 pt-2.5">
                  <span className="text-small leading-[1.4] font-semibold text-ink">Subtotal</span>
                  <span className="text-small leading-[1.4] font-semibold text-ink">
                    {item.subtotalLabel}
                  </span>
                </div>
              )}
            </div>
          ))}

          <div className="mt-1 flex justify-between gap-3 border-t-2 border-ink py-5">
            <span className="text-lead leading-[1.4] font-semibold text-ink">Total Pesanan</span>
            <span className="text-lead leading-[1.4] font-bold text-ink">
              {order.totalPrice === 0 ? 'Belum ada tagihan' : order.totalPriceLabel}
            </span>
          </div>
        </section>

        <div className="gutter flex flex-col gap-3 pt-8 pb-12">
          {canPay && (
            <Form route="customer.transaction.store" routeParams={{ number: order.orderNumber }}>
              {({ processing }) => (
                <SolidButton type="submit" disabled={processing}>
                  Bayar Sekarang
                </SolidButton>
              )}
            </Form>
          )}

          <Link
            route="customer.orders.receipt"
            routeParams={{ number: order.orderNumber }}
            className="flex min-h-12 items-center justify-center border border-rule-field px-4 text-small font-medium tracking-[0.08em] text-ink uppercase transition-colors hover:bg-paper-tint"
          >
            Lihat Struk
          </Link>

          <Link
            route="customer.orders.index"
            className="flex min-h-12 items-center justify-center border border-rule-field px-4 text-small font-medium tracking-[0.08em] text-ink uppercase transition-colors hover:bg-paper-tint"
          >
            Kembali ke Riwayat
          </Link>

          {canCancel && (
            <ConfirmDialog
              triggerClassName="flex min-h-12 w-full items-center justify-center border border-destructive px-4 text-small font-medium tracking-[0.08em] text-destructive uppercase transition-colors hover:bg-destructive/5"
              label="Batalkan Pesanan"
              title="Batalkan pesanan ini?"
              description={`Penjemputan untuk ${order.orderNumber} akan dibatalkan dan pesanan tidak dapat diaktifkan kembali.`}
            >
              <Form route="customer.orders.update" routeParams={{ number: order.orderNumber }}>
                {({ processing }) => (
                  <ConfirmFooter label="Batalkan Pesanan" processing={processing} destructive />
                )}
              </Form>
            </ConfirmDialog>
          )}
        </div>
      </div>
    </CustomerLayout>
  )
}
