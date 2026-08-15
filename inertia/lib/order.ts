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

/**
 * Turns the goods on an order into the rows a receipt prints: one heading per
 * item, then the services booked against it. Items still waiting on inspection
 * carry no services and are kept, so the customer can see the laundry has them.
 */
export function groupLinesByItem(items: OrderItem[]): ReceiptGroup[] {
  return items.map((item, index) => ({
    key: String(item.id ?? index),
    title: [item.typeLabel, [item.brand, item.model].filter(Boolean).join(' ')]
      .filter(Boolean)
      .join(' — '),
    lines: (item.services ?? []).map((service) => ({
      id: service.id,
      name: service.name,
      subtotal: service.subtotal,
      subtotalLabel: service.subtotalLabel,
    })),
    subtotal: item.subtotal,
    subtotalLabel: item.subtotalLabel,
  }))
}
