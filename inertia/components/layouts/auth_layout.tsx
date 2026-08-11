import { BackLink, Eyebrow, Lede, PageTitle, Shell } from '@/components/atoms/editorial'
import { Head } from '@inertiajs/react'
import { type PropsWithChildren, type ReactNode } from 'react'

export default function AuthLayout({
  children,
  title,
  description,
  metaTitle,
  metaDescription,
  audience,
  eyebrow,
}: PropsWithChildren<{
  title: string
  description: string
  metaTitle: string
  metaDescription: string
  audience?: string
  eyebrow?: ReactNode
}>) {
  return (
    <div className="min-h-dvh bg-white">
      <Head>
        <title>{metaTitle}</title>
        <meta name="description" content={metaDescription} />
      </Head>

      <Shell className="flex flex-col tablet:max-w-170 desktop:max-w-190">
        <header className="gutter flex justify-between pt-6">
          <BackLink route="home">← Kembali</BackLink>
          {audience && (
            <span className="text-micro tracking-[0.14em] text-ink-faint uppercase">
              {audience}
            </span>
          )}
        </header>

        <div className="flex-1">
          <div className="gutter flex flex-col items-center pt-8 pb-10 text-center">
            <img src="/images/logo_full.jpg" alt="ümima" className="mb-7 w-32.5 object-contain" />
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
