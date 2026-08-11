import {
  BackLink,
  Lede,
  PageTitle,
  StatusBadge,
  UnderlineInput,
} from '@/components/atoms/editorial'
import CustomerLayout from '@/components/layouts/customer_layout'
import { Field, FieldLabel } from '@/components/ui/field'
import type { Data } from '@/generated/data'
import type { InertiaProps } from '@/types'
import { useMemo, useState } from 'react'

type PageProps = InertiaProps<{
  orders: Data.Order[]
  summaries: Record<string, string>
}>

export default function Index({ orders, summaries }: PageProps) {
  const [query, setQuery] = useState('')

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase()

    if (!needle) {
      return orders
    }

    return orders.filter(
      (order) =>
        order.orderNumber.toLowerCase().includes(needle) ||
        order.statusLabel.toLowerCase().includes(needle) ||
        (summaries[order.id] ?? '').toLowerCase().includes(needle)
    )
  }, [orders, query, summaries])

  return (
    <CustomerLayout title="Riwayat Pesanan" description="Riwayat pesanan UmimaClean Anda">
      <header className="gutter pt-6">
        <BackLink route="customer.profile.show">← Kembali</BackLink>
      </header>

      <div className="flex-1 pb-nav">
        <div className="gutter pt-7 pb-2">
          <PageTitle className="mb-1.5">Riwayat Pesanan</PageTitle>
          <Lede>Cari dan lihat detail pesanan Anda.</Lede>
        </div>

        <div className="gutter pt-5">
          <Field>
            <FieldLabel htmlFor="order-search" className="field-label mb-2.5">
              Cari Pesanan
            </FieldLabel>
            <UnderlineInput
              id="order-search"
              type="text"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="No. pesanan, status, atau merk barang"
            />
          </Field>
          <div aria-live="polite" className="mt-2.5 text-meta text-ink-subtle">
            {filtered.length} dari {orders.length} pesanan
          </div>
        </div>

        <div className="gutter pt-5">
          {filtered.map((order) => (
            <div key={order.id} className="mb-4 border border-rule-strong">
              <div className="flex items-start justify-between gap-3 px-5 py-4.5">
                <div>
                  <div className="text-body leading-[1.4] font-semibold text-ink">
                    {order.orderNumber}
                  </div>
                  <div className="mt-0.5 text-meta leading-normal text-ink-subtle">
                    {order.createdAt} · {summaries[order.id] ?? 'Tanpa barang'}
                  </div>
                </div>
                <StatusBadge emphasis={order.isCompleted}>{order.statusLabel}</StatusBadge>
              </div>
              <a
                href={`/orders/${order.orderNumber}`}
                className="block border-t border-rule px-5 py-3 text-meta font-medium text-ink"
              >
                Lihat Detail →
              </a>
            </div>
          ))}

          {filtered.length === 0 && (
            <div className="py-8 text-center text-small leading-[1.6] text-ink-subtle">
              Tidak ada pesanan yang cocok dengan pencarian.
            </div>
          )}
        </div>
      </div>
    </CustomerLayout>
  )
}
