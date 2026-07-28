import { buttonVariants } from '@/components/ui/button'
import { usePage } from '@inertiajs/react'
import { IconFileSpreadsheet } from '@tabler/icons-react'

/**
 * Downloads the screen as an Excel file.
 *
 * The link is built from the URL the browser is already on — the same trick
 * `Pagination` uses — so whatever filters the page is showing are the filters
 * the file contains, without every admin screen having to remember to pass its
 * own along. Every admin list answers `/export` under its own path, which is
 * what makes one component enough for all six of them.
 *
 * `page` is deliberately dropped: an export is the whole filtered list, not
 * the ten rows that happen to be on screen.
 *
 * A plain anchor rather than an Inertia `Link`, because the response is a file.
 * An Inertia visit would fetch it over XHR and then find no page to render.
 */
export function ExportButton({ label = 'Ekspor Excel' }: { label?: string }) {
  const { url } = usePage()

  const [path, query] = url.split('?')
  const params = new URLSearchParams(query)
  params.delete('page')

  const search = params.toString()

  return (
    <a
      href={`${path}/export${search ? `?${search}` : ''}`}
      download
      className={buttonVariants({
        variant: 'outline',
        className: 'rounded-xl border-gray-300 text-black hover:bg-gray-100 active:scale-95',
      })}
    >
      <IconFileSpreadsheet className="size-4" />
      {label}
    </a>
  )
}
