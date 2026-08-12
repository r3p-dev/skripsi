import {
  BackLink,
  Eyebrow,
  OutlineButton,
  PageTitle,
  StatusBadge,
} from '@/components/atoms/editorial'
import CustomerLayout from '@/components/layouts/customer_layout'
import type { Data } from '@/generated/data'
import type { InertiaProps } from '@/types'

type PageProps = InertiaProps<{
  order: Data.Order | null
  items: Data.Item[]
  address: Data.Address | null
}>

export default function Show({ order, items, address }: PageProps) {
  return (
    <CustomerLayout
      title={order ? order.orderNumber : 'Pesanan'}
      description="Detail pesanan UmimaClean Anda"
    >
      <header className="gutter pt-6">
        <BackLink route="customer.profile.show">← Riwayat Pesanan</BackLink>
      </header>

      <div className="flex-1 pb-nav desktop:pb-page">
        {order ? (
          <>
            <div className="gutter flex items-start justify-between gap-3 pt-7 pb-2">
              <div>
                <PageTitle className="mb-1.5">{order.orderNumber}</PageTitle>
                <div className="text-small leading-[1.6] text-ink-muted">{order.createdAt}</div>
              </div>
              <StatusBadge emphasis={order.isCompleted}>{order.statusLabel}</StatusBadge>
            </div>

            <section className="gutter pt-6">
              <Eyebrow className="mb-2">Alamat Penjemputan</Eyebrow>
              <div className="text-body leading-[1.6] text-ink-body">
                {address?.street ?? 'Alamat tidak tersedia'}
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
                      <span className="text-small leading-normal text-ink-body">
                        — {service.name}
                      </span>
                      <span className="text-small leading-normal whitespace-nowrap text-ink-body">
                        {service.priceLabel}
                      </span>
                    </div>
                  ))}

                  <div className="mt-1.5 flex justify-between gap-3 border-t border-black/6 pt-2.5">
                    <span className="text-small leading-[1.4] font-semibold text-ink">
                      Subtotal
                    </span>
                    <span className="text-small leading-[1.4] font-semibold text-ink">
                      {item.subtotalLabel}
                    </span>
                  </div>
                </div>
              ))}

              <div className="mt-1 flex justify-between gap-3 border-t-2 border-ink py-5">
                <span className="text-lead leading-[1.4] font-semibold text-ink">
                  Total Pesanan
                </span>
                <span className="text-lead leading-[1.4] font-bold text-ink">
                  {order.totalPriceLabel}
                </span>
              </div>
            </section>

            <div className="gutter pt-8 pb-12">
              <a href="/orders" className="block">
                <OutlineButton render={<span />}>Kembali ke Riwayat</OutlineButton>
              </a>
            </div>
          </>
        ) : (
          <div className="gutter py-16 text-center">
            <div className="mb-5 text-body leading-[1.6] text-ink-subtle">
              Pesanan tidak ditemukan.
            </div>
            <a href="/orders" className="inline-block">
              <OutlineButton render={<span />} className="px-8">
                Kembali ke Riwayat
              </OutlineButton>
            </a>
          </div>
        )}
      </div>
    </CustomerLayout>
  )
}
