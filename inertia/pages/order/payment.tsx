import {
  Eyebrow,
  OutlineButton,
  PageTitle,
  Panel,
  SectionLabel,
  Shell,
  SolidButton,
} from '@/components/atoms/editorial'
import { OrderBackLink, RetryPaymentForm } from '@/components/molecules/payment'
import type { Data } from '@/generated/data'
import type { InertiaProps } from '@/types'
import { Transmit } from '@adonisjs/transmit-client'
import { Head } from '@inertiajs/react'
import {
  IconArrowLeft,
  IconCircleCheck,
  IconClock,
  IconDownload,
  IconRefresh,
} from '@tabler/icons-react'
import { useEffect, useState } from 'react'
import { TransactionStatus } from '@/enums/transaction_enum'

type PageProps = InertiaProps<{
  order: Data.Order.Variants['toDetail']
  transaction: Data.Transaction
}>

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

export default function Payment({ order, transaction: initialTransaction }: PageProps) {
  const [transaction, setTransaction] = useState(initialTransaction)
  const isPaid = transaction.status === TransactionStatus.PAID
  const isPending = transaction.status === TransactionStatus.PENDING

  useEffect(() => {
    if (!isPending) return

    const transmit = new Transmit({ baseUrl: window.location.origin })
    const subscription = transmit.subscription(`orders/${order.orderNumber}`)

    subscription.create().then(() => {
      subscription.onMessage<{
        transactionStatus: TransactionStatus | null
      }>((message) => {
        const status = message.transactionStatus

        if (!status) return

        setTransaction((current) => ({ ...current, status }))
      })
    })

    return () => {
      subscription.delete()
      transmit.close()
    }
  }, [isPending, order.orderNumber])

  return (
    <div className="min-h-dvh bg-paper">
      <Head>
        <title>{`Pembayaran ${order.orderNumber}`}</title>
        <meta name="description" content="Pembayaran pesanan UmimaClean Anda" />
      </Head>

      <Shell className="flex flex-col tablet:my-14 tablet:min-h-auto tablet:rounded-[6px] tablet:border tablet:border-rule tablet:shadow-[0_24px_64px_rgba(0,0,0,0.08)]">
        <header className="gutter flex items-center gap-3 pt-6">
          <OrderBackLink
            orderNumber={order.orderNumber}
            className="flex size-11 shrink-0 items-center justify-center border border-rule-field text-ink transition-colors hover:bg-paper-tint"
          >
            <IconArrowLeft className="size-5" />
          </OrderBackLink>
          <div className="min-w-0">
            <Eyebrow className="mb-1">Pembayaran</Eyebrow>
            <PageTitle className="truncate">{order.orderNumber}</PageTitle>
          </div>
        </header>

        <div className="gutter flex flex-1 flex-col gap-4 pt-7 pb-page">
          <div className="relative overflow-hidden bg-ink px-6 py-8 text-center text-white">
            <div
              className="absolute inset-0 opacity-5"
              style={{
                backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)',
                backgroundSize: '32px 32px',
              }}
            />
            <div className="relative">
              <p className="m-0 text-eyebrow leading-[1.4] tracking-[0.2em] text-white/70 uppercase">
                Total Tagihan
              </p>
              <p className="m-0 mt-2 text-title leading-[1.2] font-bold">
                {order.totalPrice === 0 ? '-' : order.totalPriceLabel}
              </p>
            </div>
          </div>

          {isPaid ? (
            <Panel tone="tint" className="flex flex-col items-center gap-4 px-6 py-10 text-center">
              <IconCircleCheck className="size-12 text-ink" />
              <div>
                <p className="m-0 text-lead leading-[1.4] font-semibold text-ink">
                  Pembayaran Berhasil
                </p>
                <p className="m-0 mt-1.5 text-small leading-[1.6] text-ink-soft">
                  Pesanan Anda akan segera diproses
                </p>
              </div>
              <OrderBackLink
                orderNumber={order.orderNumber}
                className="flex min-h-11 items-center justify-center bg-ink px-8 text-small font-medium tracking-[0.08em] text-white uppercase transition-colors hover:bg-ink/90"
              >
                Kembali ke Pesanan
              </OrderBackLink>
            </Panel>
          ) : isPending ? (
            <>
              <Panel tone="tint">
                <div className="border-b border-rule px-5 py-3.5">
                  <SectionLabel>Scan QRIS untuk Membayar</SectionLabel>
                </div>
                <div className="flex flex-col items-center gap-4 px-5 py-5">
                  {transaction.qrCode ? (
                    <img
                      src={transaction.qrCode}
                      alt="Kode QRIS"
                      className="aspect-square w-full max-w-65 border border-rule bg-white object-contain"
                    />
                  ) : (
                    <div className="flex aspect-square w-full max-w-65 items-center justify-center border border-dashed border-rule-field text-center text-small text-ink-subtle">
                      QR tidak tersedia
                    </div>
                  )}

                  {transaction.qrCode && (
                    <OutlineButton
                      type="button"
                      onClick={() => downloadQrCode(transaction.qrCode!, order.orderNumber)}
                      className="gap-2 bg-white py-3 text-meta"
                    >
                      <IconDownload className="size-4" />
                      Unduh Kode QR
                    </OutlineButton>
                  )}

                  <div className="flex items-center gap-2 text-small leading-normal text-ink-soft">
                    <IconClock className="size-4" />
                    Menunggu pembayaran...
                  </div>
                </div>
              </Panel>

              <p className="m-0 text-center text-meta leading-[1.6] text-ink-subtle">
                Buka aplikasi e-wallet atau mobile banking Anda, lalu pindai kode QR di atas.
                Halaman ini akan otomatis diperbarui setelah pembayaran diterima.
              </p>
            </>
          ) : (
            <Panel
              tone="tint"
              className="flex flex-col items-center gap-4 border-dashed px-6 py-16 text-center"
            >
              <div>
                <p className="m-0 text-lead leading-[1.4] font-semibold text-ink">
                  {transaction.statusLabel ?? 'Pembayaran Gagal'}
                </p>
                <p className="m-0 mt-1.5 text-small leading-[1.6] text-ink-soft">
                  Kode QR sudah tidak berlaku. Silakan buat pembayaran baru.
                </p>
              </div>
              <RetryPaymentForm orderNumber={order.orderNumber}>
                {({ processing }) => (
                  <SolidButton type="submit" disabled={processing} className="gap-2">
                    <IconRefresh className="size-4" />
                    Buat Pembayaran Baru
                  </SolidButton>
                )}
              </RetryPaymentForm>
            </Panel>
          )}
        </div>
      </Shell>
    </div>
  )
}
