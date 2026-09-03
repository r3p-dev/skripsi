export function Stepper({
  label,
  value,
  onChange,
}: {
  label: string
  value: number
  onChange: (next: number) => void
}) {
  return (
    <div className="flex items-center justify-between border-b border-rule py-3.5 last:border-b-0">
      <span className="text-lead leading-[1.4] text-ink">{label}</span>
      <div role="group" aria-label={`Jumlah ${label}`} className="flex items-center gap-4">
        <button
          type="button"
          onClick={() => onChange(Math.max(0, value - 1))}
          aria-label={`Kurangi jumlah ${label}`}
          className="flex size-8 items-center justify-center rounded-full border border-rule-field text-ink disabled:opacity-40"
          disabled={value === 0}
        >
          −
        </button>
        <span aria-live="polite" className="min-w-4 text-center text-lead font-semibold text-ink">
          {value}
        </span>
        <button
          type="button"
          onClick={() => onChange(value + 1)}
          aria-label={`Tambah jumlah ${label}`}
          className="flex size-8 items-center justify-center rounded-full border border-rule-field text-ink"
        >
          +
        </button>
      </div>
    </div>
  )
}
