import { type ReactNode } from 'react'

export function PageHeader({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow: string
  title: string
  description?: string
  action?: ReactNode
}) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div className="min-w-0">
        <p className="eyebrow">{eyebrow}</p>
        <h1 className="text-title leading-[1.4] font-semibold text-balance text-ink">{title}</h1>
        {description && (
          <p className="mt-1.5 text-small leading-[1.6] text-ink-muted">{description}</p>
        )}
      </div>
      {action}
    </div>
  )
}
