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
        <p className="text-xs font-medium tracking-[0.3em] text-gray-600 uppercase">{eyebrow}</p>
        <h1 className="text-2xl font-bold tracking-tight text-balance text-black sm:text-3xl">
          {title}
        </h1>
        {description && <p className="mt-1 text-sm text-gray-600">{description}</p>}
      </div>
      {action}
    </div>
  )
}
