import { buttonVariants } from '@/components/ui/button'
import type { Metadata } from '@/types'
import { Link } from '@adonisjs/inertia/react'
import { usePage } from '@inertiajs/react'
import { IconChevronLeft, IconChevronRight } from '@tabler/icons-react'

/**
 * Rewrites the current URL with a different page number.
 *
 * Built from the URL the browser is already on rather than from a route name
 * and a list of filters, so every filter the page happens to carry — search,
 * status, type, role — survives paging without each caller having to
 * remember to pass it along.
 */
function pageUrl(url: string, page: number): string {
  const [path, query] = url.split('?')
  const params = new URLSearchParams(query)

  params.set('page', String(page))

  return `${path}?${params.toString()}`
}

export function Pagination({ metadata }: { metadata: Metadata }) {
  const { url } = usePage()

  if (metadata.lastPage <= 1) {
    return null
  }

  const isFirst = metadata.currentPage <= metadata.firstPage
  const isLast = metadata.currentPage >= metadata.lastPage

  return (
    <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
      <Link
        href={pageUrl(url, metadata.currentPage - 1)}
        preserveScroll
        aria-label="Halaman sebelumnya"
        className={buttonVariants({
          variant: 'outline',
          className: `h-11 rounded-lg px-4 md:h-9 ${isFirst ? 'pointer-events-none opacity-40' : ''}`,
        })}
      >
        <IconChevronLeft className="size-4" />
        Sebelumnya
      </Link>

      <p className="text-xs tracking-widest text-gray-500 uppercase">
        {metadata.currentPage} / {metadata.lastPage} · {metadata.total} data
      </p>

      <Link
        href={pageUrl(url, metadata.currentPage + 1)}
        preserveScroll
        aria-label="Halaman selanjutnya"
        className={buttonVariants({
          variant: 'outline',
          className: `h-11 rounded-lg px-4 md:h-9 ${isLast ? 'pointer-events-none opacity-40' : ''}`,
        })}
      >
        Selanjutnya
        <IconChevronRight className="size-4" />
      </Link>
    </div>
  )
}
