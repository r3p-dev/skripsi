import {
  BackLink,
  Eyebrow,
  OutlineButton,
  PageTitle,
  Shell,
  SolidButton,
} from '@/components/atoms/editorial'
import { ReceiptCopy } from '@/components/organisms/counter_receipt'
import type { Data } from '@/generated/data'
import type { InertiaProps } from '@/types'
import { Link } from '@adonisjs/inertia/react'
import { Head } from '@inertiajs/react'
import { IconPrinter } from '@tabler/icons-react'

type PageProps = InertiaProps<{
  order: Data.Order.Variants['toDetail']
  changeLabel: string
}>

export default function Receipt({ order, changeLabel }: PageProps) {
  return (
    <div className="min-h-dvh bg-paper print:bg-white">
      <Head>
        <title>{`Struk ${order.orderNumber}`}</title>
        <meta name="description" content="Struk pesanan konter UmimaClean" />
      </Head>

      <Shell className="flex flex-col bg-paper-tint print:max-w-none print:bg-white">
        <header className="gutter pt-6 print:hidden">
          <BackLink route="staff.trip.index">← Antrean Tugas</BackLink>
        </header>

        <div className="gutter pt-7 pb-6 print:hidden">
          <Eyebrow className="mb-1.5">Konter</Eyebrow>
          <PageTitle>Struk Pesanan</PageTitle>
        </div>

        <div className="gutter flex flex-1 flex-col gap-5 pb-page print:gap-0 print:p-0">
          <ReceiptCopy order={order} changeLabel={changeLabel} copy="Salinan Pelanggan" />
          <ReceiptCopy
            order={order}
            changeLabel={changeLabel}
            copy="Salinan Toko — Tempel di Barang"
          />

          <OutlineButton
            type="button"
            onClick={() => window.print()}
            className="gap-2 bg-white print:hidden"
          >
            <IconPrinter className="size-5" />
            Cetak 2 Struk
          </OutlineButton>

          <Link route="staff.trip.index" className="block print:hidden">
            <SolidButton render={<span />}>Selesai</SolidButton>
          </Link>
        </div>
      </Shell>
    </div>
  )
}
