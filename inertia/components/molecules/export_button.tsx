import { buttonVariants } from '@/components/ui/button'
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
      className={buttonVariants({
        variant: 'outline',
        className: 'rounded-none border-rule-field text-ink hover:bg-paper-tint active:scale-95',
      })}
    >
      <IconFileSpreadsheet className="size-4" />
      {label}
    </a>
  )
}
