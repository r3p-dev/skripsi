import CustomerLayout from '@/components/layouts/customer_layout'
import ImageSlider from '@/components/molecules/image_slide'
import { Button, buttonVariants } from '@/components/ui/button'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card'
import type { Data } from '@/generated/data'
import type { InertiaProps } from '@/types'
import { Form, Link } from '@adonisjs/inertia/react'
import {
  IconArrowLeft,
  IconCalendar,
  IconChevronRight,
  IconCreditCard,
  IconMapPin,
  IconPhotoOff,
  IconReceipt,
  IconX,
} from '@tabler/icons-react'
import { ActionName } from '@/enums/order_action_enum'
import { OrderStatus, OrderStatusLabel } from '@/enums/order_status_enum'
import { TransactionStatus } from '@/enums/transaction_enum'
import { formatDate, formatDateTime, formatRupiah } from '@/lib/format'
import { groupLinesByItem } from '@/lib/order'
import { useEffect, useState } from 'react'

type PageProps = InertiaProps<{
  order: Data.Order.Variants['toDetail']
  canCancel: boolean
}>

/**
 * The milestones shown on the customer timeline.
 *
 * Matched on the stored action name, not on its Indonesian caption. The two
 * used to be the same string, which meant rewording a caption silently emptied
 * this timeline — the captions live in `ActionNameLabel` and are printed, and
 * these are what the code matches on.
 */
const ORDER_STEPS = [
  {
    key: ActionName.PICKUP,
    photoLabel: 'Penjemputan',
    dateLabel: 'Dijemput',
  },
  {
    key: ActionName.INSPECTION,
    photoLabel: 'Inspeksi',
    dateLabel: 'Diproses',
  },
  {
    key: ActionName.CLEANING_DONE,
    photoLabel: 'Pencucian',
    dateLabel: 'Selesai Dicuci',
  },
  {
    key: ActionName.DELIVERY,
    photoLabel: 'Pengantaran',
    dateLabel: 'Diantar',
  },
] as const

/**
 * Whether every one of these images can still be fetched.
 *
 * Proof photos are kept for ninety days and then deleted by `prune:records`,
 * and the signed URLs handed out with them expire on the same schedule. Most
 * of the time the column is blanked at the same moment, so a missing photo
 * simply is not in the data — but an order photographed on the boundary can
 * arrive with a path that no longer resolves, and a comparison slider with one
 * broken half is worse than no comparison at all. Asking the browser first
 * means the section is never rendered around an image that will not load.
 *
 * `null` while the answer is still unknown, so nothing flashes on screen and
 * then vanishes.
 */
function useImagesAvailable(sources: string[]): boolean | null {
  const key = sources.join('|')

  /*
   * The answer is stored against the sources it was measured for, so a change
   * of source reads as "unknown again" during render. Resetting it from inside
   * the effect would be a second render pass for something the render already
   * knows.
   */
  const [checked, setChecked] = useState<{ key: string; available: boolean } | null>(null)

  useEffect(() => {
    if (!key) {
      return
    }

    let cancelled = false

    Promise.all(
      key.split('|').map(
        (source) =>
          new Promise<boolean>((resolve) => {
            const image = new Image()
            image.onload = () => resolve(true)
            image.onerror = () => resolve(false)
            image.src = source
          })
      )
    ).then((results) => {
      if (!cancelled) {
        setChecked({ key, available: results.every(Boolean) })
      }
    })

    return () => {
      cancelled = true
    }
  }, [key])

  if (!key) {
    return false
  }

  return checked?.key === key ? checked.available : null
}

/**
 * One proof photo, or the space where one used to be.
 *
 * The strip shows them small so the page stays short, and tapping one opens it
 * at full size — a button rather than a link because the accordion this sits
 * inside underlines every anchor it contains, which under an image tile reads
 * as a stray line rather than as a caption.
 */
function ProofPhoto({ label, path }: { label: string; path: string }) {
  const [failed, setFailed] = useState(false)

  if (failed) {
    return (
      <div className="w-56 shrink-0 snap-start">
        <div className="flex aspect-video w-full flex-col items-center justify-center gap-1.5 rounded-xl border border-dashed border-gray-300 bg-white px-3 text-center">
          <IconPhotoOff className="size-5 text-gray-400" />
          <span className="block text-xs leading-relaxed text-gray-500">
            Foto sudah dihapus setelah 90 hari
          </span>
        </div>
        <span className="mt-2 block text-sm font-medium text-black">{label}</span>
      </div>
    )
  }

  return (
    <button
      type="button"
      onClick={() => window.open(path, '_blank', 'noopener,noreferrer')}
      aria-label={`Perbesar foto ${label.toLowerCase()}`}
      className="w-56 shrink-0 snap-start rounded-xl text-left transition-opacity active:opacity-80"
    >
      <img
        src={path}
        alt={label}
        loading="lazy"
        onError={() => setFailed(true)}
        className="aspect-video w-full rounded-xl border border-gray-200 object-cover"
      />
      <span className="mt-2 block text-sm font-medium text-black">{label}</span>
    </button>
  )
}

export default function Show({ order, canCancel }: PageProps) {
  const stepActions = ORDER_STEPS.map((step) => ({
    ...step,
    action: order.actions?.find((action) => action.name === step.key),
  }))

  const proofPhotos: { key: string; label: string; path: string }[] = []
  for (const step of stepActions) {
    if (step.action?.photoPath) {
      proofPhotos.push({ key: step.key, label: step.photoLabel, path: step.action.photoPath })
    }
  }

  /**
   * The pair worth comparing: the shoes as they arrived (inspection) against the
   * shoes as they left (cleaning). Only shown once both exist — walk-ins are
   * never inspected, and an order still being washed has no "after" yet.
   */
  const inspectionPhoto = order.actions?.find(
    (action) => action.name === ActionName.INSPECTION
  )?.photoPath
  const cleaningPhoto = order.actions?.find(
    (action) => action.name === ActionName.CLEANING_DONE
  )?.photoPath
  const beforeAfter =
    inspectionPhoto && cleaningPhoto ? { before: inspectionPhoto, after: cleaningPhoto } : null

  const comparisonLoads = useImagesAvailable(
    beforeAfter ? [beforeAfter.before, beforeAfter.after] : []
  )

  const needsPayment = order.status === OrderStatus.AWAITING_PAYMENT
  const pendingTransaction = order.transactions?.find(
    (transaction) => transaction.status === TransactionStatus.PENDING
  )

  const itemGroups = groupLinesByItem(order.items ?? [])

  /**
   * The receipt is the record of a finished transaction. Offering it while the
   * shoes are still on the rack invites a customer to treat a work-in-progress
   * quote as a final bill — the items can still be corrected right up until the
   * order is paid for.
   */
  const hasReceipt = order.status === OrderStatus.COMPLETED

  const recordedDates = stepActions.filter((step) => step.action)

  return (
    <CustomerLayout title={order.orderNumber} description="Detail pesanan UmimaClean Anda">
      <div className="flex items-center gap-3 px-6 py-5">
        <Link
          route="customer.order.index"
          className="flex size-11 shrink-0 items-center justify-center rounded-full border border-gray-300 text-black transition-colors hover:bg-gray-100 active:scale-95"
        >
          <IconArrowLeft className="size-5" />
        </Link>
        <div>
          <p className="text-xs tracking-[0.3em] text-gray-600 uppercase font-medium">Pesanan</p>
          <h1 className="text-2xl font-bold tracking-tight text-black">{order.orderNumber}</h1>
        </div>
      </div>

      <div className="flex-1 space-y-4 px-6 pb-nav">
        <div className="relative overflow-hidden rounded-2xl bg-black px-6 py-8 text-white">
          <div
            className="absolute inset-0 opacity-5"
            style={{
              backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)',
              backgroundSize: '32px 32px',
            }}
          />
          <div className="relative space-y-1">
            <p className="text-xs tracking-[0.3em] text-white/70 uppercase font-medium">
              Status Pesanan
            </p>
            <p className="text-2xl font-bold tracking-tight">
              {OrderStatusLabel[order.status as keyof typeof OrderStatusLabel]}
            </p>
          </div>
        </div>

        {needsPayment && (
          <Card className="rounded-2xl border border-gray-200 bg-gray-50 p-5">
            <div className="flex items-center gap-3">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-black/10">
                <IconCreditCard className="size-5 text-black" />
              </div>
              <div>
                <p className="text-xs tracking-widest text-gray-500 uppercase">Status Pembayaran</p>
                <p className="text-base font-medium text-black">Menunggu Pelunasan</p>
              </div>
            </div>

            {pendingTransaction ? (
              <Link
                route="customer.transaction.show"
                routeParams={{ number: order.orderNumber }}
                className={buttonVariants({
                  className:
                    'h-12 w-full rounded-xl bg-black text-base font-semibold tracking-wide text-white hover:bg-black/90 active:scale-95',
                })}
              >
                Lanjutkan Pembayaran
              </Link>
            ) : (
              <Form route="customer.transaction.store" routeParams={{ number: order.orderNumber }}>
                {({ processing }) => (
                  <Button
                    type="submit"
                    disabled={processing}
                    className="h-12 w-full rounded-xl bg-black text-base font-semibold tracking-wide text-white hover:bg-black/90 active:scale-95"
                  >
                    Bayar Sekarang
                  </Button>
                )}
              </Form>
            )}
          </Card>
        )}

        {/*
          Left open rather than folded away: this is the one thing on the page
          a customer came to see, and it is a single frame either way.
        */}
        {beforeAfter && comparisonLoads && (
          <Card className="rounded-2xl border border-gray-200 bg-gray-50">
            <CardHeader>
              <p className="text-xs tracking-widest text-gray-600 uppercase font-medium">
                Sebelum &amp; Sesudah
              </p>
            </CardHeader>
            <CardContent>
              <ImageSlider beforeImage={beforeAfter.before} afterImage={beforeAfter.after} />
            </CardContent>
          </Card>
        )}

        {/*
          Folded away, and scrolling sideways when opened. Four proof photos
          stacked full-width used to add some two thousand pixels to this page,
          which pushed the dates, the items and the total far below the fold —
          so the sections a customer opens the page to read were the hardest
          ones to reach.
        */}
        {proofPhotos.length > 0 && (
          <Card className="rounded-2xl border border-gray-200 bg-gray-50">
            <CardContent className="px-0">
              <Accordion>
                <AccordionItem value="progress" className="border-b-0">
                  <AccordionTrigger className="px-5 text-sm font-semibold text-black">
                    <span className="flex items-baseline gap-2">
                      Progres Pesanan
                      <span className="text-xs font-normal text-gray-500">
                        {proofPhotos.length} foto
                      </span>
                    </span>
                  </AccordionTrigger>
                  <AccordionContent className="px-0">
                    <div className="flex snap-x snap-mandatory gap-3 overflow-x-auto px-5 pb-1">
                      {proofPhotos.map((photo) => (
                        <ProofPhoto key={photo.key} label={photo.label} path={photo.path} />
                      ))}
                    </div>
                    <p className="px-5 pt-3 text-xs leading-relaxed text-gray-500">
                      Geser untuk melihat foto lain, ketuk untuk memperbesar.
                    </p>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </CardContent>
          </Card>
        )}

        <Card className="rounded-2xl border border-gray-200 bg-gray-50 p-5">
          <div className="flex items-center gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-black/10">
              <IconCalendar className="size-5 text-black" />
            </div>
            <div>
              <p className="text-xs tracking-widest text-gray-500 uppercase">Tanggal Penjemputan</p>
              <p className="text-base font-medium text-black">{formatDate(order.pickupDate)}</p>
            </div>
          </div>

          {order.address && (
            <div className="flex items-start gap-3">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-black/10">
                <IconMapPin className="size-5 text-black" />
              </div>
              <div>
                <p className="text-xs tracking-widest text-gray-500 uppercase">
                  Alamat Penjemputan
                </p>
                <p className="text-base font-medium text-black">{order.address.name}</p>
                <p className="text-sm text-gray-600">{order.address.phone}</p>
                <p className="text-sm leading-relaxed text-gray-700">{order.address.street}</p>
              </div>
            </div>
          )}
        </Card>

        {/*
          Reference data — the order number, when each stage happened. Worth
          having, rarely the reason the page was opened, and it grows a row
          with every milestone. Folded.
        */}
        <Card className="rounded-2xl border border-gray-200 bg-gray-50">
          <CardContent className="px-0">
            <Accordion>
              <AccordionItem value="details" className="border-b-0">
                <AccordionTrigger className="px-5 text-sm font-semibold text-black">
                  Detail Pesanan
                </AccordionTrigger>
                {/*
                  Rows are spans, not paragraphs: the accordion panel puts a
                  bottom margin on every `p` it contains except the last, which
                  on a table of label-and-value pairs pushes each value onto a
                  line of its own.
                */}
                <AccordionContent className="px-5">
                  <div className="divide-y divide-gray-200">
                    <div className="flex items-center justify-between gap-3 py-2">
                      <span className="text-sm text-gray-600">Nomor Pesanan</span>
                      <span className="text-sm font-semibold text-black">{order.orderNumber}</span>
                    </div>
                    <div className="flex items-center justify-between gap-3 py-2">
                      <span className="text-sm text-gray-600">Tanggal Pemesanan</span>
                      <span className="text-sm font-semibold text-black">
                        {formatDate(order.createdAt)}
                      </span>
                    </div>
                    {recordedDates.map((step) => (
                      <div key={step.key} className="flex items-center justify-between gap-3 py-2">
                        <span className="text-sm text-gray-600">{step.dateLabel}</span>
                        <span className="text-sm font-semibold text-black">
                          {formatDateTime(step.action!.createdAt)}
                        </span>
                      </div>
                    ))}
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </CardContent>
        </Card>

        {itemGroups.length > 0 && (
          <Card className="rounded-2xl border border-gray-200 bg-gray-50">
            <CardHeader>
              <p className="text-xs tracking-widest text-gray-600 uppercase font-medium">
                Item Pesanan
              </p>
            </CardHeader>
            <CardContent>
              <div className="divide-y divide-gray-200">
                {itemGroups.map((group) => (
                  <div key={group.key} className="py-3 first:pt-0 last:pb-0">
                    <p className="text-sm font-semibold text-black">{group.title}</p>
                    <div className="mt-1.5 space-y-1">
                      {group.lines.map((line) => (
                        <div key={line.id} className="flex items-baseline justify-between gap-3">
                          <p className="text-sm text-gray-600">{line.service?.name ?? line.name}</p>
                          <p className="text-sm font-medium whitespace-nowrap text-black">
                            {formatRupiah(line.subtotal)}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
            <CardFooter className="flex items-center justify-between">
              <p className="text-sm font-semibold tracking-wide text-black uppercase">Total</p>
              <p className="text-lg font-bold tracking-tight text-black">
                {order.totalPrice === null ? 'Belum ada tagihan' : formatRupiah(order.totalPrice)}
              </p>
            </CardFooter>
          </Card>
        )}

        {hasReceipt && (
          <Link
            route="customer.order.receipt"
            routeParams={{ number: order.orderNumber }}
            className={buttonVariants({
              variant: 'outline',
              className:
                'h-12 w-full rounded-xl text-base font-semibold tracking-wide text-black active:scale-95',
            })}
          >
            <IconReceipt className="size-5" />
            Lihat Struk
            <IconChevronRight className="size-4" />
          </Link>
        )}

        {/*
          Always rendered, disabled once the pickup day arrives, so the rule
          stays visible instead of the button silently disappearing.
        */}
        <Form route="customer.order.update" routeParams={{ number: order.orderNumber }}>
          {({ processing }) => (
            <>
              <Button
                type="submit"
                variant="outline"
                disabled={!canCancel || processing}
                className="h-12 w-full rounded-xl border-destructive/30 text-base font-semibold tracking-wide text-destructive hover:bg-red-50 active:scale-95 disabled:opacity-50"
              >
                <IconX className="size-5" />
                Batalkan Pesanan
              </Button>

              {!canCancel && (
                <p className="mt-2 text-center text-xs leading-relaxed text-gray-500">
                  Pesanan hanya dapat dibatalkan sebelum tanggal penjemputan.
                </p>
              )}
            </>
          )}
        </Form>
      </div>
    </CustomerLayout>
  )
}
