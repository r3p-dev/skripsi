import { Eyebrow, Lede, PageTitle } from '@/components/atoms/editorial'
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
    <div className="mb-6 flex flex-col gap-4 border-b border-rule pb-5 tablet:flex-row tablet:items-end tablet:justify-between">
      <div className="min-w-0">
        <Eyebrow className="mb-1.5">{eyebrow}</Eyebrow>
        <PageTitle className="text-balance">{title}</PageTitle>
        {description && <Lede className="mt-1.5">{description}</Lede>}
      </div>
      {action && <div className="flex flex-wrap items-center gap-2">{action}</div>}
    </div>
  )
}
