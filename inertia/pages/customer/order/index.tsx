import {
  BackLink,
  Lede,
  PageTitle,
  StatusBadge,
  UnderlineInput,
} from '@/components/atoms/editorial'
import CustomerLayout from '@/components/layouts/customer_layout'
import { cn } from '@/lib/utils'
import { Field, FieldLabel } from '@/components/ui/field'
import type { Data } from '@/generated/data'
import type { InertiaProps } from '@/types'
import { useMemo, useState } from 'react'

type PageProps = InertiaProps<{
  orders: Data.Order[]
  summaries: Record<string, string>
}>

const PAGE_SIZE = 10

const pagerButton =
  'flex size-9 items-center justify-center rounded-full border border-rule-field text-ink disabled:text-ink-faint'

export default function Index({ orders, summaries }: PageProps) {
  const [query, setQuery] = useState('')
  const [page, setPage] = useState(1)

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

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const currentPage = Math.min(page, totalPages)
  const visible = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE)

  return (
    <CustomerLayout title="Riwayat Pesanan" description="Riwayat pesanan UmimaClean Anda">
      <header className="gutter pt-6">
        <BackLink route="customer.profile.show">← Kembali</BackLink>
      </header>

      <div className="flex-1 pb-nav desktop:pb-page">
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
              onChange={(event) => {
                setQuery(event.target.value)
                setPage(1)
              }}
              placeholder="No. pesanan, status, atau merk barang"
            />
          </Field>
          <div aria-live="polite" className="mt-2.5 text-meta text-ink-subtle">
            {filtered.length} dari {orders.length} pesanan
          </div>
        </div>

        <div className="gutter pt-5">
          {visible.map((order) => (
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

        {totalPages > 1 && (
          <nav
            aria-label="Navigasi halaman pesanan"
            className="gutter flex flex-wrap items-center justify-center gap-2 pt-2 pb-10"
          >
            <button
              type="button"
              onClick={() => setPage(Math.max(1, currentPage - 1))}
              disabled={currentPage <= 1}
              aria-label="Halaman sebelumnya"
              className={pagerButton}
            >
              ‹
            </button>

            {Array.from({ length: totalPages }, (_, index) => index + 1).map((number) => {
              const isCurrent = number === currentPage

              return (
                <button
                  key={number}
                  type="button"
                  onClick={() => setPage(number)}
                  aria-label={`Halaman ${number}`}
                  aria-current={isCurrent ? 'page' : undefined}
                  className={cn(
                    'flex size-9 items-center justify-center rounded-full border text-small',
                    isCurrent
                      ? 'border-ink bg-ink font-semibold text-white'
                      : 'border-rule-field text-ink'
                  )}
                >
                  {number}
                </button>
              )
            })}

            <button
              type="button"
              onClick={() => setPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage >= totalPages}
              aria-label="Halaman berikutnya"
              className={pagerButton}
            >
              ›
            </button>
          </nav>
        )}
      </div>
    </CustomerLayout>
  )
}
