import type { Data } from '@/generated/data'

export type OrderLine = NonNullable<Data.Order.Variants['toDetail']['items']>[number]

export type ItemGroup = {
  key: string
  title: string
  lines: OrderLine[]
}

/**
 * Groups an order's priced lines by the thing they were done to.
 *
 * An order carries one line per item *and service*, so a single pair of shoes
 * with a wash and a deodorizer is two rows sharing one item. Listed flat, the
 * page repeated "Nike Air Force 1" once per service and the customer had to
 * work out for themselves which charges belonged to which pair.
 *
 * Shared rather than owned by the detail screen: the two receipts print the
 * same lines, and a receipt that groups them differently from the page it was
 * opened from reads as a different order rather than as the same one.
 */
export function groupLinesByItem(lines: OrderLine[]): ItemGroup[] {
  const groups = new Map<string, ItemGroup>()

  for (const line of lines) {
    const item = line.item
    const key = item ? `item-${item.id}` : `line-${line.id}`

    let group = groups.get(key)

    if (!group) {
      group = {
        key,
        /*
         * Falls back to the composed line name for a line whose item did not
         * come along — the flat label is wrong as a heading, but it is still
         * the only description of the thing there is.
         */
        title: item ? `${item.brand} ${item.model}`.trim() : line.name,
        lines: [],
      }
      groups.set(key, group)
    }

    group.lines.push(line)
  }

  return [...groups.values()]
}
