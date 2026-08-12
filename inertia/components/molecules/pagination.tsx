import type { Metadata } from '@/types'
import { cn } from '@/lib/utils'
import { Link } from '@adonisjs/inertia/react'
import { usePage } from '@inertiajs/react'
import { IconChevronLeft, IconChevronRight } from '@tabler/icons-react'

function pageUrl(url: string, page: number): string {
  const [path, query] = url.split('?')
  const params = new URLSearchParams(query)

  params.set('page', String(page))

  return `${path}?${params.toString()}`
}

const step =
  'flex min-h-11 items-center gap-1.5 border border-rule-field px-4 text-meta font-medium text-ink transition-colors hover:bg-paper-tint'

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
        className={cn(step, isFirst && 'pointer-events-none opacity-40')}
      >
        <IconChevronLeft className="size-4" />
        Sebelumnya
      </Link>

      <p className="order-last w-full text-center text-micro tracking-[0.14em] text-ink-subtle uppercase tablet:order-0 tablet:w-auto">
        {metadata.currentPage} / {metadata.lastPage} · {metadata.total} data
      </p>

      <Link
        href={pageUrl(url, metadata.currentPage + 1)}
        preserveScroll
        aria-label="Halaman selanjutnya"
        className={cn(step, isLast && 'pointer-events-none opacity-40')}
      >
        Selanjutnya
        <IconChevronRight className="size-4" />
      </Link>
    </div>
  )
}
