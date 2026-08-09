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

function useImagesAvailable(sources: string[]): boolean | null {
  const key = sources.join('|')

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

        <Card className="rounded-2xl border border-gray-200 bg-gray-50">
          <CardContent className="px-0">
            <Accordion>
              <AccordionItem value="details" className="border-b-0">
                <AccordionTrigger className="px-5 text-sm font-semibold text-black">
                  Detail Pesanan
                </AccordionTrigger>
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
