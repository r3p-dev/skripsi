import { usePage } from '@inertiajs/react'
import { IconFileSpreadsheet } from '@tabler/icons-react'

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
      className="flex min-h-11 items-center gap-2 border border-rule-field px-4 text-meta font-medium tracking-[0.04em] text-ink transition-colors hover:bg-paper-tint"
    >
      <IconFileSpreadsheet className="size-4" />
      {label}
    </a>
  )
}
