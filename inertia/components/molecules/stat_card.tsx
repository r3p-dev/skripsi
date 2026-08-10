import { Card } from '@/components/ui/card'
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
    <Card className="gap-2 rounded-none border border-rule bg-paper-tint p-5">
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs font-medium tracking-widest text-ink-soft uppercase">{label}</p>
        <IconComponent className="size-5 shrink-0 text-ink-faint" />
      </div>
      <p className="text-2xl font-bold tracking-tight text-ink">{value}</p>
      {hint && <p className="text-xs text-ink-subtle">{hint}</p>}
    </Card>
  )
}
