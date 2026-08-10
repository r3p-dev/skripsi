import { buttonVariants } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import type { Data } from '@/generated/data'
import type { InertiaProps } from '@/types'
import { Link } from '@adonisjs/inertia/react'
import { Head } from '@inertiajs/react'
import { IconArrowLeft, IconPrinter } from '@tabler/icons-react'

type PageProps = InertiaProps<{
  order: Data.Order.Variants['toDetail']
}>

export default function Tag({ order }: PageProps) {
  return (
    <div className="mx-auto flex min-h-dvh max-w-md flex-col bg-white">
      <Head>
        <title>{`Label ${order.orderNumber}`}</title>
        <meta name="description" content="Label barang pesanan UmimaClean" />
      </Head>

      <div className="flex items-center gap-3 px-6 py-5 print:hidden">
        <Link
          route="staff.trip.index"
          className="flex size-11 shrink-0 items-center justify-center rounded-full border border-rule-field text-ink transition-colors hover:bg-paper-tint active:scale-95"
        >
          <IconArrowLeft className="size-5" />
        </Link>
        <div>
          <p className="text-xs tracking-[0.3em] text-ink-soft uppercase font-medium">Pencucian</p>
          <h1 className="text-2xl font-bold tracking-tight text-ink">Label Barang</h1>
        </div>
      </div>

      <div className="flex-1 px-6 pb-page">
        <Card className="gap-0 overflow-hidden rounded-none border-2 border-dashed border-ink p-0 print:rounded-none">
          <div className="border-b-2 border-dashed border-ink bg-ink px-5 py-4 text-center text-white print:bg-white print:text-ink">
            <p className="text-xs tracking-[0.3em] uppercase">UmimaClean</p>
            <p className="text-2xl font-bold tracking-tight">{order.orderNumber}</p>
          </div>

          <div className="space-y-1 border-b-2 border-dashed border-ink px-5 py-4 text-center">
            <p className="text-lg font-bold text-ink">{order.customerName}</p>
            <p className="text-sm text-ink-body">{order.customerPhone}</p>
            <p className="text-xs tracking-widest text-ink-soft uppercase">
              {order.type} · {order.items?.length ?? 0} item
            </p>
          </div>

          <div className="px-5 py-4">
            {order.items?.length ? (
              <div className="divide-y divide-dashed divide-rule-field">
                {order.items.map((item, index) => (
                  <div key={item.id} className="flex items-start gap-3 py-2">
                    <span className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full border border-ink text-xs font-bold">
                      {index + 1}
                    </span>
                    <p className="text-sm font-semibold text-ink">{item.name}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="py-2 text-center text-sm text-ink-soft">Belum ada barang tercatat</p>
            )}
          </div>

          <div className="border-t-2 border-dashed border-ink px-5 py-3 text-center">
            <p className="text-xs tracking-widest text-ink-soft uppercase">Masuk</p>
            <p className="text-sm font-semibold text-ink">{order.createdAt}</p>
          </div>
        </Card>

        <button
          type="button"
          onClick={() => window.print()}
          className={buttonVariants({
            className:
              'mt-6 h-12 w-full rounded-none bg-ink text-base font-semibold tracking-wide text-white hover:bg-ink/90 active:scale-95 print:hidden',
          })}
        >
          <IconPrinter className="size-5" />
          Cetak Label
        </button>
      </div>
    </div>
  )
}
