import type { Data } from '@/generated/data'

export type OrderLine = NonNullable<Data.Order.Variants['toDetail']['items']>[number]

export type ItemGroup = {
  key: string
  title: string
  lines: OrderLine[]
}

export function groupLinesByItem(lines: OrderLine[]): ItemGroup[] {
  const groups = new Map<string, ItemGroup>()

  for (const line of lines) {
    const item = line.item
    const key = item ? `item-${item.id}` : `line-${line.id}`

    let group = groups.get(key)

    if (!group) {
      group = {
        key,
        title: item ? `${item.brand} ${item.model}`.trim() : line.name,
        lines: [],
      }
      groups.set(key, group)
    }

    group.lines.push(line)
  }

  return [...groups.values()]
}
