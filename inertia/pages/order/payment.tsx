import { Button, buttonVariants } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import type { Data } from '@/generated/data'
import type { InertiaProps } from '@/types'
import { Form, Link } from '@adonisjs/inertia/react'
import { Transmit } from '@adonisjs/transmit-client'
import { Head } from '@inertiajs/react'
import {
  IconArrowLeft,
  IconCircleCheck,
  IconClock,
  IconDownload,
  IconRefresh,
} from '@tabler/icons-react'
import { type PropsWithChildren, useEffect, useState } from 'react'
import type { ComponentProps } from 'react'
import { TransactionStatus, TransactionStatusLabel } from '@/enums/transaction_enum'
import { formatRupiah } from '@/lib/format'

type BackRoute = 'customer.order.show' | 'staff.trip.index'
type RetryRoute = 'customer.transaction.store' | 'staff.transaction.store'

type PageProps = InertiaProps<{
  order: Data.Order.Variants['toDetail']
  transaction: Data.Transaction
  backRoute: BackRoute
  retryRoute: RetryRoute
}>

function BackLink({
  backRoute,
  orderNumber,
  className,
  children,
}: PropsWithChildren<{ backRoute: BackRoute; orderNumber: string; className?: string }>) {
  if (backRoute === 'customer.order.show') {
    return (
      <Link route="customer.order.show" routeParams={{ number: orderNumber }} className={className}>
        {children}
      </Link>
    )
  }

  return (
    <Link route="staff.trip.index" className={className}>
      {children}
    </Link>
  )
}

function RetryForm({
  retryRoute,
  orderNumber,
  children,
}: {
  retryRoute: RetryRoute
  orderNumber: string
  children: ComponentProps<typeof Form>['children']
}) {
  if (retryRoute === 'customer.transaction.store') {
    return (
      <Form route="customer.transaction.store" routeParams={{ number: orderNumber }}>
        {children}
      </Form>
    )
  }

  return (
    <Form route="staff.transaction.store" routeParams={{ number: orderNumber }}>
      {children}
    </Form>
  )
}

async function downloadQrCode(source: string, orderNumber: string) {
  try {
    const response = await fetch(source)

    if (!response.ok) {
      throw new Error(`Unexpected ${response.status}`)
    }

    const objectUrl = URL.createObjectURL(await response.blob())
    const anchor = document.createElement('a')

    anchor.href = objectUrl
    anchor.download = `qris-${orderNumber}.png`
    document.body.appendChild(anchor)
    anchor.click()
    anchor.remove()

    URL.revokeObjectURL(objectUrl)
  } catch {
    window.open(source, '_blank', 'noopener,noreferrer')
  }
}

export default function Payment({
  order,
  transaction: initialTransaction,
  backRoute,
  retryRoute,
}: PageProps) {
  const [transaction, setTransaction] = useState(initialTransaction)
  const isPaid = transaction.status === TransactionStatus.PAID
  const isPending = transaction.status === TransactionStatus.PENDING

  useEffect(() => {
    if (!isPending) return

    const transmit = new Transmit({ baseUrl: window.location.origin })
    const subscription = transmit.subscription(`orders/${order.orderNumber}`)

    subscription.create().then(() => {
      subscription.onMessage<{
        transactionStatus: string | null
      }>((message) => {
        if (!message.transactionStatus) return

        setTransaction((current) => ({
          ...current,
          status: message.transactionStatus!,
        }))
      })
    })

    return () => {
      subscription.delete()
      transmit.close()
    }
  }, [isPending, order.orderNumber])

  return (
    <div className="mx-auto flex min-h-dvh max-w-md flex-col bg-white">
      <Head>
        <title>{`Pembayaran ${order.orderNumber}`}</title>
        <meta name="description" content="Pembayaran pesanan UmimaClean Anda" />
      </Head>

      <div className="flex items-center gap-3 px-6 py-5">
        <BackLink
          backRoute={backRoute}
          orderNumber={order.orderNumber}
          className="flex size-11 shrink-0 items-center justify-center rounded-full border border-rule-field text-ink transition-colors hover:bg-paper-tint active:scale-95"
        >
          <IconArrowLeft className="size-5" />
        </BackLink>
        <div>
          <p className="text-xs tracking-[0.3em] text-ink-soft uppercase font-medium">Pembayaran</p>
          <h1 className="text-2xl font-bold tracking-tight text-ink">{order.orderNumber}</h1>
        </div>
      </div>

      <div className="flex-1 space-y-4 px-6 pb-page">
        <div className="relative overflow-hidden rounded-none bg-ink px-6 py-8 text-center text-white">
          <div
            className="absolute inset-0 opacity-5"
            style={{
              backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)',
              backgroundSize: '32px 32px',
            }}
          />
          <div className="relative space-y-1">
            <p className="text-xs tracking-[0.3em] text-white/70 uppercase font-medium">
              Total Tagihan
            </p>
            <p className="text-3xl font-bold tracking-tight">
              {order.totalPrice === null ? '-' : formatRupiah(order.totalPrice)}
            </p>
          </div>
        </div>

        {isPaid ? (
          <Card className="flex flex-col items-center gap-3 rounded-none border border-rule bg-paper-tint px-6 py-10 text-center">
            <div className="flex size-14 items-center justify-center rounded-full bg-ink/10">
              <IconCircleCheck className="size-7 text-ink" />
            </div>
            <div>
              <p className="text-base font-semibold text-ink">Pembayaran Berhasil</p>
              <p className="text-sm text-ink-soft">Pesanan Anda akan segera diproses</p>
            </div>
            <BackLink
              backRoute={backRoute}
              orderNumber={order.orderNumber}
              className={buttonVariants({
                className:
                  'h-11 rounded-none bg-ink px-6 text-sm font-semibold tracking-wide text-white hover:bg-ink/90 active:scale-95',
              })}
            >
              Kembali ke Pesanan
            </BackLink>
          </Card>
        ) : isPending ? (
          <>
            <Card className="rounded-none border border-rule bg-paper-tint">
              <CardHeader>
                <p className="text-xs tracking-widest text-ink-soft uppercase font-medium">
                  Scan QRIS untuk Membayar
                </p>
              </CardHeader>
              <CardContent className="flex flex-col items-center gap-4 pb-6">
                {transaction.qrCode ? (
                  <img
                    src={transaction.qrCode}
                    alt="Kode QRIS"
                    className="aspect-square w-full max-w-65 rounded-none border border-rule object-contain"
                  />
                ) : (
                  <div className="flex aspect-square w-full max-w-65 items-center justify-center rounded-none border border-dashed border-rule-field text-center text-sm text-ink-subtle">
                    QR tidak tersedia
                  </div>
                )}
                {transaction.qrCode && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => downloadQrCode(transaction.qrCode!, order.orderNumber)}
                    className="h-11 w-full rounded-none text-sm font-semibold tracking-wide text-ink active:scale-95"
                  >
                    <IconDownload className="size-4" />
                    Unduh Kode QR
                  </Button>
                )}

                <div className="flex items-center gap-2 text-sm text-ink-soft">
                  <IconClock className="size-4" />
                  Menunggu pembayaran...
                </div>
              </CardContent>
            </Card>

            <p className="text-center text-xs leading-relaxed text-ink-subtle">
              Buka aplikasi e-wallet atau mobile banking Anda, lalu pindai kode QR di atas. Halaman
              ini akan otomatis diperbarui setelah pembayaran diterima.
            </p>
          </>
        ) : (
          <Card className="flex flex-col items-center gap-4 rounded-none border border-dashed border-rule-field bg-paper-tint px-6 py-16 text-center">
            <div className="space-y-1">
              <p className="text-base font-semibold text-ink">
                {TransactionStatusLabel[
                  transaction.status as keyof typeof TransactionStatusLabel
                ] ?? 'Pembayaran Gagal'}
              </p>
              <p className="text-sm text-ink-soft">
                Kode QR sudah tidak berlaku. Silakan buat pembayaran baru.
              </p>
            </div>
            <RetryForm retryRoute={retryRoute} orderNumber={order.orderNumber}>
              {({ processing }) => (
                <Button
                  type="submit"
                  disabled={processing}
                  className="h-11 rounded-none bg-ink px-6 text-sm font-semibold tracking-wide text-white hover:bg-ink/90 active:scale-95"
                >
                  <IconRefresh className="size-4" />
                  Buat Pembayaran Baru
                </Button>
              )}
            </RetryForm>
          </Card>
        )}
      </div>
    </div>
  )
}
