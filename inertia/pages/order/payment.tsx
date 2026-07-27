import { Button, buttonVariants } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import type { Data } from '@/generated/data'
import type { InertiaProps } from '@/types'
import { Form, Link } from '@adonisjs/inertia/react'
import { Transmit } from '@adonisjs/transmit-client'
import { Head } from '@inertiajs/react'
import { IconArrowLeft, IconCircleCheck, IconClock, IconRefresh } from '@tabler/icons-react'
import { type PropsWithChildren, useEffect, useState } from 'react'
import type { ComponentProps } from 'react'

type BackRoute = 'customer.order.show' | 'staff.trip.index'
type RetryRoute = 'customer.transaction.store' | 'staff.transaction.store'

type PageProps = InertiaProps<{
  order: Data.Order
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

/**
 * Displays the QRIS code for an order's payment and reflects Midtrans
 * status changes live via Transmit, without a full page reload. Kept
 * outside the customer bottom-nav shell so it can be reused for any
 * role that needs to show a customer's payment (e.g. staff assisting
 * at the counter), not just the customer app. The caller decides where
 * "back" and "retry" should lead via backRoute/retryRoute.
 */
export default function Payment({
  order,
  transaction: initialTransaction,
  backRoute,
  retryRoute,
}: PageProps) {
  const [transaction, setTransaction] = useState(initialTransaction)
  const isPaid = transaction.status === 'Terbayar'
  const isPending = transaction.status === 'Tertunda'

  useEffect(() => {
    if (!isPending) return

    const transmit = new Transmit({ baseUrl: window.location.origin })
    const subscription = transmit.subscription(`orders/${order.orderNumber}`)

    subscription.create().then(() => {
      subscription.onMessage<{
        transactionStatusLabel: string
      }>((message) => {
        setTransaction((current) => ({
          ...current,
          status: message.transactionStatusLabel,
        }))
      })
    })

    return () => {
      subscription.delete()
      transmit.close()
    }
  }, [isPending, order.orderNumber])

  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col bg-white">
      <Head>
        <title>{`Pembayaran ${order.orderNumber}`}</title>
        <meta name="description" content="Pembayaran pesanan UmimaClean Anda" />
      </Head>

      <div className="flex items-center gap-3 px-6 py-5">
        <BackLink
          backRoute={backRoute}
          orderNumber={order.orderNumber}
          className="flex size-9 items-center justify-center rounded-full border border-gray-300 text-black transition-colors hover:bg-gray-100 active:scale-95"
        >
          <IconArrowLeft className="size-5" />
        </BackLink>
        <div>
          <p className="text-xs tracking-[0.3em] text-gray-600 uppercase font-medium">Pembayaran</p>
          <h1 className="text-2xl font-bold tracking-tight text-black">{order.orderNumber}</h1>
        </div>
      </div>

      <div className="flex-1 space-y-4 px-6 pb-10">
        <div className="relative overflow-hidden rounded-2xl bg-black px-6 py-8 text-center text-white">
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
            <p className="text-3xl font-bold tracking-tight">{order.totalPrice ?? '-'}</p>
          </div>
        </div>

        {isPaid ? (
          <Card className="flex flex-col items-center gap-3 rounded-2xl border border-gray-200 bg-gray-50 px-6 py-10 text-center">
            <div className="flex size-14 items-center justify-center rounded-full bg-black/10">
              <IconCircleCheck className="size-7 text-black" />
            </div>
            <div>
              <p className="text-base font-semibold text-black">Pembayaran Berhasil</p>
              <p className="text-sm text-gray-600">Pesanan Anda akan segera diproses</p>
            </div>
            <BackLink
              backRoute={backRoute}
              orderNumber={order.orderNumber}
              className={buttonVariants({
                className:
                  'h-11 rounded-xl bg-black px-6 text-sm font-semibold tracking-wide text-white hover:bg-black/90 active:scale-95',
              })}
            >
              Kembali ke Pesanan
            </BackLink>
          </Card>
        ) : isPending ? (
          <>
            <Card className="rounded-2xl border border-gray-200 bg-gray-50">
              <CardHeader>
                <p className="text-xs tracking-widest text-gray-600 uppercase font-medium">
                  Scan QRIS untuk Membayar
                </p>
              </CardHeader>
              <CardContent className="flex flex-col items-center gap-4 pb-6">
                {transaction.qrCode ? (
                  <img
                    src={transaction.qrCode}
                    alt="Kode QRIS"
                    className="aspect-square w-full max-w-[260px] rounded-xl border border-gray-200 object-contain"
                  />
                ) : (
                  <div className="flex aspect-square w-full max-w-[260px] items-center justify-center rounded-xl border border-dashed border-gray-300 text-center text-sm text-gray-500">
                    QR tidak tersedia
                  </div>
                )}
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <IconClock className="size-4" />
                  Menunggu pembayaran...
                </div>
              </CardContent>
            </Card>

            <p className="text-center text-xs leading-relaxed text-gray-500">
              Buka aplikasi e-wallet atau mobile banking Anda, lalu pindai kode QR di atas. Halaman
              ini akan otomatis diperbarui setelah pembayaran diterima.
            </p>
          </>
        ) : (
          <Card className="flex flex-col items-center gap-4 rounded-2xl border border-dashed border-gray-300 bg-gray-50 px-6 py-16 text-center">
            <div className="space-y-1">
              <p className="text-base font-semibold text-black">
                {transaction.status ?? 'Pembayaran Gagal'}
              </p>
              <p className="text-sm text-gray-600">
                Kode QR sudah tidak berlaku. Silakan buat pembayaran baru.
              </p>
            </div>
            <RetryForm retryRoute={retryRoute} orderNumber={order.orderNumber}>
              {({ processing }) => (
                <Button
                  type="submit"
                  disabled={processing}
                  className="h-11 rounded-xl bg-black px-6 text-sm font-semibold tracking-wide text-white hover:bg-black/90 active:scale-95"
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
