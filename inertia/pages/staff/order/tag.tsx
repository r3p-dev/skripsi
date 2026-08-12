import { BackLink, Eyebrow, PageTitle, Shell, SolidButton } from '@/components/atoms/editorial'
import type { Data } from '@/generated/data'
import type { InertiaProps } from '@/types'
import { Head } from '@inertiajs/react'
import { IconPrinter } from '@tabler/icons-react'

type PageProps = InertiaProps<{
  order: Data.Order.Variants['toDetail']
}>

export default function Tag({ order }: PageProps) {
  return (
    <div className="min-h-dvh bg-paper print:bg-white">
      <Head>
        <title>{`Label ${order.orderNumber}`}</title>
        <meta name="description" content="Label barang pesanan UmimaClean" />
      </Head>

      <Shell className="flex flex-col print:max-w-none">
        <header className="gutter pt-6 print:hidden">
          <BackLink route="staff.trip.index">← Antrean Tugas</BackLink>
        </header>

        <div className="gutter pt-7 pb-6 print:hidden">
          <Eyebrow className="mb-1.5">Pencucian</Eyebrow>
          <PageTitle>Label Barang</PageTitle>
        </div>

        <div className="gutter flex-1 pb-page print:p-0">
          <div className="break-inside-avoid border-2 border-dashed border-ink">
            <div className="border-b-2 border-dashed border-ink bg-ink px-5 py-4 text-center text-white print:bg-white print:text-ink">
              <p className="m-0 text-meta tracking-[0.3em] uppercase">UmimaClean</p>
              <p className="m-0 text-title leading-[1.2] font-bold">{order.orderNumber}</p>
            </div>

            <div className="border-b-2 border-dashed border-ink px-5 py-4 text-center">
              <p className="m-0 text-lead leading-[1.4] font-bold text-ink">{order.customerName}</p>
              <p className="m-0 mt-0.5 text-small leading-normal text-ink-body">
                {order.customerPhone}
              </p>
              <p className="m-0 mt-1 text-micro tracking-[0.14em] text-ink-soft uppercase">
                {order.type} · {order.items?.length ?? 0} item
              </p>
            </div>

            <div className="px-5 py-4">
              {order.items?.length ? (
                <div className="flex flex-col">
                  {order.items.map((item, index) => (
                    <div
                      key={item.id}
                      className="flex items-start gap-3 border-b border-dashed border-rule-field py-2.5 last:border-b-0"
                    >
                      <span className="mt-px flex size-6 shrink-0 items-center justify-center rounded-full border border-ink text-micro font-bold">
                        {index + 1}
                      </span>
                      <p className="m-0 text-small leading-normal font-semibold text-ink">
                        {item.name}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="m-0 py-2 text-center text-small leading-normal text-ink-soft">
                  Belum ada barang tercatat
                </p>
              )}
            </div>

            <div className="border-t-2 border-dashed border-ink px-5 py-3 text-center">
              <p className="m-0 text-micro tracking-[0.14em] text-ink-soft uppercase">Masuk</p>
              <p className="m-0 text-small leading-normal font-semibold text-ink">
                {order.createdAt}
              </p>
            </div>
          </div>

          <SolidButton
            type="button"
            onClick={() => window.print()}
            className="mt-6 gap-2 print:hidden"
          >
            <IconPrinter className="size-5" />
            Cetak Label
          </SolidButton>
        </div>
      </Shell>
    </div>
  )
}
