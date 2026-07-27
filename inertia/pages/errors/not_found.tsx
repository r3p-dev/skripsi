import { buttonVariants } from '@/components/ui/button'
import { Link } from '@adonisjs/inertia/react'
import { Head } from '@inertiajs/react'
import { IconChevronRight, IconSearchOff } from '@tabler/icons-react'

export default function NotFound() {
  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col bg-white">
      <Head>
        <title>Halaman Tidak Ditemukan</title>
        <meta name="description" content="Halaman yang Anda cari tidak dapat ditemukan" />
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
          <IconSearchOff className="relative size-11 text-white" />
        </div>

        <p className="mb-2 text-xs tracking-[0.3em] text-gray-600 uppercase font-medium">
          Error 404
        </p>
        <h1 className="mb-3 text-3xl font-bold tracking-tight text-black">
          Halaman Tidak Ditemukan
        </h1>
        <p className="mb-10 max-w-xs text-sm leading-relaxed text-gray-700">
          Halaman yang Anda cari mungkin telah dipindahkan, dihapus, atau memang tidak pernah ada.
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
      </div>
    </div>
  )
}
