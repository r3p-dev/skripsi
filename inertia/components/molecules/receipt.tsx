import { type ReactNode } from 'react'

export function ReceiptRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex items-baseline gap-2">
      <span className="text-ink-soft">{label}</span>
      <span className="receipt-leader" />
      <span className="text-right font-semibold">{children}</span>
    </div>
  )
}

export function ReceiptPerforation() {
  return <div className="border-t border-dashed border-rule-field" />
}
