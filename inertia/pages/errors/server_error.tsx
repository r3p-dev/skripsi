import { buttonVariants } from '@/components/ui/button'
import { Link } from '@adonisjs/inertia/react'
import { Head } from '@inertiajs/react'
import { IconChevronRight, IconRefresh, IconServerOff } from '@tabler/icons-react'

export default function ServerError() {
  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col bg-white">
      <Head>
        <title>Terjadi Kesalahan</title>
        <meta name="description" content="Server kami sedang mengalami gangguan" />
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
          <IconServerOff className="relative size-11 text-white" />
        </div>

        <p className="mb-2 text-xs tracking-[0.3em] text-gray-600 uppercase font-medium">
          Error 500
        </p>
        <h1 className="mb-3 text-3xl font-bold tracking-tight text-black">Terjadi Kesalahan</h1>
        <p className="mb-10 max-w-xs text-sm leading-relaxed text-gray-700">
          Server kami sedang mengalami gangguan. Silakan coba lagi beberapa saat lagi.
        </p>

        <div className="flex w-full flex-col gap-3">
          <button
            type="button"
            onClick={() => window.location.reload()}
            className={buttonVariants({
              className:
                'h-12 w-full rounded-xl bg-black text-base font-semibold tracking-wide text-white transition-all duration-300 hover:bg-black/90 active:scale-95',
            })}
          >
            Muat Ulang
            <IconRefresh className="size-5" />
          </button>

          <Link
            route="home"
            className={buttonVariants({
              variant: 'outline',
              className:
                'h-12 w-full rounded-xl text-base font-semibold tracking-wide text-black active:scale-95',
            })}
          >
            Kembali ke Beranda
            <IconChevronRight className="size-4" />
          </Link>
        </div>
      </div>
    </div>
  )
}
