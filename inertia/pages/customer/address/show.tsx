import { BackLink, Lede, OutlineButton, PageTitle, SolidButton } from '@/components/atoms/editorial'
import StaticMap from '@/components/organisms/static_map'
import type { Data } from '@/generated/data'
import type { InertiaProps } from '@/types'
import { Link } from '@adonisjs/inertia/react'
import CustomerLayout from '@/components/layouts/customer_layout'

type PageProps = InertiaProps<{
  address: Data.Address | null
}>

export default function Show({ address }: PageProps) {
  return (
    <CustomerLayout title="Alamat" description="Alamat penjemputan UmimaClean Anda">
      <header className="gutter pt-6">
        <BackLink route="customer.profile.show">← Kembali</BackLink>
      </header>

      <div className="flex-1 pb-nav">
        <div className="gutter pt-7 pb-6">
          <PageTitle className="mb-1.5">Alamat</PageTitle>
          <Lede>Anda hanya dapat menyimpan satu alamat utama.</Lede>
        </div>

        {address ? (
          <>
            <div className="gutter pb-6">
              <div className="border border-rule">
                <StaticMap latitude={address.latitude} longitude={address.longitude} height={240} />
              </div>
            </div>

            <div className="gutter">
              <div className="mb-4 border border-rule-strong p-5">
                <div className="mb-0.5 text-body leading-[1.4] font-semibold text-ink">
                  {address.name}
                </div>
                <div className="mb-3 text-small leading-normal text-ink-subtle">
                  {address.phone}
                </div>
                <div className="text-body leading-[1.6] text-[#444]">{address.street}</div>
                {address.note && (
                  <div className="mt-3 text-small leading-normal text-ink-subtle">
                    {address.note}
                  </div>
                )}
              </div>

              <Link route="customer.address.create" className="mb-10 block">
                <OutlineButton render={<span />}>Ubah Alamat</OutlineButton>
              </Link>
            </div>
          </>
        ) : (
          <div className="gutter py-16 text-center">
            <div className="mb-5 text-body leading-[1.6] text-ink-subtle">
              Anda belum menambahkan alamat penjemputan.
            </div>
            <Link route="customer.address.create" className="block">
              <SolidButton render={<span />}>Tambah Alamat</SolidButton>
            </Link>
          </div>
        )}
      </div>
    </CustomerLayout>
  )
}
