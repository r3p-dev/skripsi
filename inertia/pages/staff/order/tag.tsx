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

/**
 * A tag staff cut out and attach to the customer's batch of items while it
 * sits on the cleaning rack, so nobody has to guess whose shoes are whose.
 *
 * Everything outside the tag itself is hidden when printing.
 */
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
          className="flex size-11 shrink-0 items-center justify-center rounded-full border border-gray-300 text-black transition-colors hover:bg-gray-100 active:scale-95"
        >
          <IconArrowLeft className="size-5" />
        </Link>
        <div>
          <p className="text-xs tracking-[0.3em] text-gray-600 uppercase font-medium">Pencucian</p>
          <h1 className="text-2xl font-bold tracking-tight text-black">Label Barang</h1>
        </div>
      </div>

      <div className="flex-1 px-6 pb-page">
        <Card className="gap-0 overflow-hidden rounded-2xl border-2 border-dashed border-black p-0 print:rounded-none">
          <div className="border-b-2 border-dashed border-black bg-black px-5 py-4 text-center text-white print:bg-white print:text-black">
            <p className="text-xs tracking-[0.3em] uppercase">UmimaClean</p>
            <p className="text-2xl font-bold tracking-tight">{order.orderNumber}</p>
          </div>

          <div className="space-y-1 border-b-2 border-dashed border-black px-5 py-4 text-center">
            <p className="text-lg font-bold text-black">{order.customerName}</p>
            <p className="text-sm text-gray-700">{order.customerPhone}</p>
            <p className="text-xs tracking-widest text-gray-600 uppercase">
              {order.type} · {order.items?.length ?? 0} item
            </p>
          </div>

          <div className="px-5 py-4">
            {order.items?.length ? (
              <div className="divide-y divide-dashed divide-gray-400">
                {/*
                  `name` is composed by the transformer as
                  "<service> - <brand> <model>", which is what tells two
                  otherwise similar pairs apart on the rack.
                */}
                {order.items.map((item, index) => (
                  <div key={item.id} className="flex items-start gap-3 py-2">
                    <span className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full border border-black text-xs font-bold">
                      {index + 1}
                    </span>
                    <p className="text-sm font-semibold text-black">{item.name}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="py-2 text-center text-sm text-gray-600">Belum ada barang tercatat</p>
            )}
          </div>

          <div className="border-t-2 border-dashed border-black px-5 py-3 text-center">
            <p className="text-xs tracking-widest text-gray-600 uppercase">Masuk</p>
            <p className="text-sm font-semibold text-black">{order.createdAt}</p>
          </div>
        </Card>

        <button
          type="button"
          onClick={() => window.print()}
          className={buttonVariants({
            className:
              'mt-6 h-12 w-full rounded-xl bg-black text-base font-semibold tracking-wide text-white hover:bg-black/90 active:scale-95 print:hidden',
          })}
        >
          <IconPrinter className="size-5" />
          Cetak Label
        </button>
      </div>
    </div>
  )
}
