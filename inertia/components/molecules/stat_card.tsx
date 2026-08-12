import { Panel, SectionLabel } from '@/components/atoms/editorial'
import { type Icon } from '@tabler/icons-react'

export function StatCard({
  label,
  value,
  hint,
  icon: IconComponent,
}: {
  label: string
  value: string | number
  hint?: string
  icon: Icon
}) {
  return (
    <Panel tone="tint" className="px-5 py-4.5">
      <div className="flex items-start justify-between gap-3">
        <SectionLabel>{label}</SectionLabel>
        <IconComponent className="size-4.5 shrink-0 text-ink-faint" />
      </div>
      <p className="mt-2 mb-0 text-title leading-[1.2] font-semibold text-ink">{value}</p>
      {hint && <p className="mt-1 mb-0 text-meta leading-normal text-ink-subtle">{hint}</p>}
    </Panel>
  )
}
