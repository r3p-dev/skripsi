import { Link } from '@adonisjs/inertia/react'
import { Head } from '@inertiajs/react'
import { type PropsWithChildren } from 'react'

export default function AuthLayout({
  children,
  title,
  description,
  metaTitle,
  metaDescription,
}: PropsWithChildren<{
  title: string
  description: string
  metaTitle: string
  metaDescription: string
}>) {
  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col bg-white">
      <Head>
        <title>{metaTitle}</title>
        <meta name="description" content={metaDescription} />
      </Head>

      <div className="px-6 py-5">
        <Link route="home" className="flex items-center gap-3">
          <img src="/images/logo.jpg" alt="UmimaClean" className="size-14" />
          <div>
            <h1 className="mb-0.5 text-2xl font-bold tracking-tight text-black">UmimaClean</h1>
            <p className="text-xs tracking-widest text-gray-600 uppercase">Layanan Cuci Sepatu</p>
          </div>
        </Link>
      </div>

      <div className="flex flex-1 flex-col px-6 pb-10">
        <div className="mb-8 space-y-2">
          <p className="text-xs tracking-[0.3em] text-gray-600 uppercase font-medium">Akun</p>
          <h2 className="text-3xl font-bold tracking-tight text-black">{title}</h2>
          <p className="text-sm leading-relaxed text-gray-700 pt-1">{description}</p>
        </div>

        {children}
      </div>
    </div>
  )
}
