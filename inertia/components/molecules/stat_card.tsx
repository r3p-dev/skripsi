import { Card } from '@/components/ui/card'
import { type Icon } from '@tabler/icons-react'

/**
 * One headline figure on the dashboard.
 */
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
    <Card className="gap-2 rounded-2xl border border-gray-200 bg-gray-50 p-5">
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs font-medium tracking-widest text-gray-600 uppercase">{label}</p>
        <IconComponent className="size-5 shrink-0 text-gray-400" />
      </div>
      <p className="text-2xl font-bold tracking-tight text-black">{value}</p>
      {hint && <p className="text-xs text-gray-500">{hint}</p>}
    </Card>
  )
}
