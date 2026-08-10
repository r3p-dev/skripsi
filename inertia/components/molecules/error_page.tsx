import { Eyebrow, Lede, PageTitle, Shell } from '@/components/atoms/editorial'
import { Head } from '@inertiajs/react'
import type { ReactNode } from 'react'

export default function ErrorPage({
  metaTitle,
  metaDescription,
  eyebrow,
  title,
  description,
  children,
}: {
  metaTitle: string
  metaDescription: string
  eyebrow: string
  title: string
  description: string
  children: ReactNode
}) {
  return (
    <div className="min-h-dvh bg-white">
      <Head>
        <title>{metaTitle}</title>
        <meta name="description" content={metaDescription} />
      </Head>

      <Shell className="flex flex-col tablet:max-w-[680px] desktop:max-w-[760px]">
        <div className="gutter flex flex-1 flex-col items-center justify-center py-20 text-center">
          <img src="/images/logo_full.jpg" alt="ümima" className="mb-9 w-[110px] object-contain" />

          <Eyebrow className="mb-4">{eyebrow}</Eyebrow>
          <PageTitle className="mb-3">{title}</PageTitle>
          <Lede className="mb-10 max-w-[320px]">{description}</Lede>

          <div className="flex w-full max-w-[320px] flex-col gap-3">{children}</div>
        </div>
      </Shell>
    </div>
  )
}
