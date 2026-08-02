import CustomerLayout from '@/components/layouts/customer_layout'
import ImageSlider from '@/components/molecules/image_slide'
import { Button, buttonVariants } from '@/components/ui/button'
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
  IconReceipt,
  IconX,
} from '@tabler/icons-react'
import { ActionName } from '@/enums/order_action_enum'
import { OrderStatus, OrderStatusLabel } from '@/enums/order_status_enum'
import { TransactionStatus } from '@/enums/transaction_enum'
import { formatDate, formatDateTime, formatRupiah } from '@/lib/format'

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

  const needsPayment = order.status === OrderStatus.AWAITING_PAYMENT
  const pendingTransaction = order.transactions?.find(
    (transaction) => transaction.status === TransactionStatus.PENDING
  )

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

        {beforeAfter && (
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

        {proofPhotos.length > 0 && (
          <Card className="rounded-2xl border border-gray-200 bg-gray-50">
            <CardHeader>
              <p className="text-xs tracking-widest text-gray-600 uppercase font-medium">
                Progres Pesanan
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              {proofPhotos.map((photo) => (
                <div key={photo.key}>
                  <p className="mb-2 text-sm font-medium text-black">{photo.label}</p>
                  <img
                    src={photo.path}
                    alt={photo.label}
                    className="aspect-video w-full rounded-xl border border-gray-200 object-cover"
                  />
                </div>
              ))}
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
              <p className="text-base font-medium text-black">{order.pickupDate ?? '-'}</p>
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

        <Card className="rounded-2xl border border-gray-200 bg-gray-50 p-5">
          <div className="divide-y divide-gray-200">
            <div className="flex items-center justify-between py-2">
              <p className="text-sm text-gray-600">Nomor Pesanan</p>
              <p className="text-sm font-semibold text-black">{order.orderNumber}</p>
            </div>
            <div className="flex items-center justify-between py-2">
              <p className="text-sm text-gray-600">Tanggal Pemesanan</p>
              <p className="text-sm font-semibold text-black">{formatDate(order.createdAt)}</p>
            </div>
            {stepActions.map((step) =>
              step.action ? (
                <div key={step.key} className="flex items-center justify-between py-2">
                  <p className="text-sm text-gray-600">{step.dateLabel}</p>
                  <p className="text-sm font-semibold text-black">
                    {formatDateTime(step.action.createdAt)}
                  </p>
                </div>
              ) : null
            )}
          </div>
        </Card>

        {!!order.items?.length && (
          <Card className="rounded-2xl border border-gray-200 bg-gray-50">
            <CardHeader>
              <p className="text-xs tracking-widest text-gray-600 uppercase font-medium">
                Item Pesanan
              </p>
            </CardHeader>
            <CardContent>
              <div className="divide-y divide-gray-200">
                {order.items.map((item) => (
                  <div key={item.id} className="flex items-center justify-between gap-3 py-3">
                    <div>
                      <p className="text-sm font-medium text-black">{item.name}</p>
                      <p className="text-xs text-gray-500">{formatRupiah(item.price)}</p>
                    </div>
                    <p className="text-sm font-semibold text-black">
                      {formatRupiah(item.subtotal)}
                    </p>
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
