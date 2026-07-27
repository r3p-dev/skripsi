import { buttonVariants } from '@/components/ui/button'
import { Link } from '@adonisjs/inertia/react'
import { Head } from '@inertiajs/react'
import { IconChevronRight, IconLinkOff } from '@tabler/icons-react'

export default function InvalidSignature() {
  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col bg-white">
      <Head>
        <title>Tautan Tidak Valid</title>
        <meta name="description" content="Tautan yang Anda gunakan sudah tidak valid" />
      </Head>

      <div className="flex flex-1 flex-col items-center justify-center px-6 py-16 text-center">
        <div className="relative mb-8 flex size-24 items-center justify-center overflow-hidden rounded-2xl bg-black">
          <div
            className="absolute inset-0 opacity-10"
            style={{
              backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)',
              backgroundSize: '20px 20px',
            }}
          />
          <IconLinkOff className="relative size-11 text-white" />
        </div>

        <p className="mb-2 text-xs tracking-[0.3em] text-gray-600 uppercase font-medium">
          Tautan Kedaluwarsa
        </p>
        <h1 className="mb-3 text-3xl font-bold tracking-tight text-black">Tautan Tidak Valid</h1>
        <p className="mb-10 max-w-xs text-sm leading-relaxed text-gray-700">
          Tautan yang Anda gunakan sudah tidak valid atau sudah kedaluwarsa. Silakan minta tautan
          baru untuk melanjutkan.
        </p>

        <Link
          route="home"
          className={buttonVariants({
            className:
              'h-12 rounded-xl bg-black px-8 text-base font-semibold tracking-wide text-white transition-all duration-300 hover:bg-black/90 active:scale-95',
          })}
        >
          Kembali ke Beranda
          <IconChevronRight className="size-5" />
        </Link>

        <Link
          route="session.create"
          className="mt-4 text-sm font-medium text-gray-600 underline underline-offset-4"
        >
          Masuk ke Akun
        </Link>
      </div>
    </div>
  )
}
