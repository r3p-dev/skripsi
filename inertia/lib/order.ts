import type { Data } from '@/generated/data'

type OrderItem = NonNullable<Data.Order.Variants['toDetail']['items']>[number]

export type ReceiptLine = {
  id: number
  name: string
  subtotal: number
  subtotalLabel: string
}

export type ReceiptGroup = {
  key: string
  title: string
  lines: ReceiptLine[]
  subtotal: number
  subtotalLabel: string
}

export function groupLinesByItem(items: OrderItem[]): ReceiptGroup[] {
  return items.map((item, index) => ({
    key: String(item.id ?? index),
    title: [item.typeLabel, [item.brand, item.model].filter(Boolean).join(' ')]
      .filter(Boolean)
      .join(' — '),
    lines: (item.catalogues ?? []).map((catalogue) => ({
      id: catalogue.id,
      name: catalogue.name,
      subtotal: catalogue.subtotal,
      subtotalLabel: catalogue.subtotalLabel,
    })),
    subtotal: item.subtotal,
    subtotalLabel: item.subtotalLabel,
  }))
}
