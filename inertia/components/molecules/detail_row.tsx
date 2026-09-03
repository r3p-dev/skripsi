export function DetailRow({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-0.5 border-b border-rule py-3 last:border-b-0">
      <p className="m-0 text-micro tracking-[0.14em] text-ink-subtle uppercase">{label}</p>
      <p className="m-0 text-small leading-normal font-medium text-ink">{value ?? '-'}</p>
    </div>
  )
}
