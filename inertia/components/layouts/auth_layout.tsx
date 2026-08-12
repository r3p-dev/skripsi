import { BackLink, Eyebrow, Lede, PageTitle, Shell } from '@/components/atoms/editorial'
import { Head } from '@inertiajs/react'
import { type PropsWithChildren, type ReactNode } from 'react'

type Brand = {
  eyebrow: string
  title: string
  description: string
}

const CUSTOMER_BRAND: Brand = {
  eyebrow: 'Portal Pelanggan',
  title: 'Perawatan sepatu, tas, dan helm — dari mana saja.',
  description: 'Kelola pesanan, alamat, dan riwayat perawatan Anda dalam satu akun.',
}

export default function AuthLayout({
  children,
  title,
  description,
  metaTitle,
  metaDescription,
  audience,
  eyebrow,
  brand = CUSTOMER_BRAND,
}: PropsWithChildren<{
  title: string
  description: string
  metaTitle: string
  metaDescription: string
  audience?: string
  eyebrow?: ReactNode
  brand?: Brand
}>) {
  return (
    <div className="min-h-dvh bg-paper desktop:flex desktop:bg-ink">
      <Head>
        <title>{metaTitle}</title>
        <meta name="description" content={metaDescription} />
      </Head>

      <aside className="hidden flex-1 flex-col justify-center bg-ink p-20 desktop:flex">
        <img src="/images/logo_full.jpg" alt="" className="mb-10 w-27.5 object-contain invert" />
        <div className="mb-5 text-eyebrow leading-[1.4] tracking-[0.2em] text-ink-faint uppercase">
          {brand.eyebrow}
        </div>
        <div className="mb-4 max-w-95 text-[32px] leading-[1.35] font-semibold text-white">
          {brand.title}
        </div>
        <div className="max-w-90 text-[15px] leading-[1.7] text-[#b3b3b3]">{brand.description}</div>
      </aside>

      <Shell
        className={[
          'flex flex-col',
          'tablet:my-14 tablet:min-h-auto tablet:max-w-205 tablet:rounded-[6px] tablet:border tablet:border-rule tablet:px-[clamp(0px,4vw,40px)] tablet:shadow-[0_24px_64px_rgba(0,0,0,0.08)]',
          'desktop:m-0 desktop:min-h-dvh desktop:max-w-135 desktop:flex-none desktop:justify-center desktop:rounded-none desktop:border-0 desktop:px-0 desktop:shadow-none',
        ].join(' ')}
      >
        <header className="gutter flex justify-between pt-6">
          <BackLink route="home">← Kembali</BackLink>
          {audience && (
            <span className="text-micro tracking-[0.14em] text-ink-faint uppercase">
              {audience}
            </span>
          )}
        </header>

        <div className="flex-1 desktop:flex-none">
          <div className="gutter flex flex-col items-center pt-8 pb-10 text-center">
            <img src="/images/logo_full.jpg" alt="Umima" className="mb-7 w-32.5 object-contain" />
            {eyebrow && <Eyebrow className="mb-4">{eyebrow}</Eyebrow>}
            <PageTitle className="mb-2">{title}</PageTitle>
            <Lede className="max-w-65">{description}</Lede>
          </div>

          <div className="gutter">{children}</div>
        </div>

        <footer className="pt-10 pb-12 text-center">
          <div className="text-meta leading-[1.6] text-ink-subtle">Bandung, Jawa Barat</div>
        </footer>
      </Shell>
    </div>
  )
}
