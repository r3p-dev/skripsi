import type { ReactNode } from 'react'

export function ProfileRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="border-b border-rule py-4">
      <div className="mb-2 text-eyebrow tracking-widest text-ink-subtle uppercase">{label}</div>
      {children}
    </div>
  )
}

export function ReadOnlyRow({
  value,
  onEdit,
  label,
}: {
  value: string
  onEdit: () => void
  label: string
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-lead leading-[1.4] text-ink">{value}</span>
      <button
        type="button"
        onClick={onEdit}
        aria-label={label}
        className="text-meta text-ink-soft hover:text-ink"
      >
        Ubah
      </button>
    </div>
  )
}

export function EditActions({
  processing,
  onCancel,
}: {
  processing?: boolean
  onCancel: () => void
}) {
  return (
    <div className="flex items-center gap-2.5">
      <button
        type="submit"
        disabled={processing}
        className="text-meta font-medium text-ink disabled:opacity-50"
      >
        Simpan
      </button>
      <button type="button" onClick={onCancel} className="text-meta text-ink-subtle">
        Batal
      </button>
    </div>
  )
}
