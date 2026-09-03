# Admin Orders — Technical

## Routes

| Method | URL                     | Controller           | Route name           |
| ------ | ----------------------- | -------------------- | -------------------- |
| GET    | `/admin/orders/export`  | `admin.Order.export` | `admin.order.export` |
| GET    | `/admin/orders`         | `admin.Order.index`  | `admin.order.index`  |
| GET    | `/admin/orders/:number` | `admin.Order.show`   | `admin.order.show`   |

`export` is registered **before** `orders/:number`, otherwise `/orders/export`
would bind `number = 'export'`.

## Files

| Concern     | Path                                                                                               |
| ----------- | -------------------------------------------------------------------------------------------------- |
| Controller  | [app/controllers/admin/order_controller.ts](../../../../app/controllers/admin/order_controller.ts) |
| Service     | [app/services/order_service.ts](../../../../app/services/order_service.ts)                         |
| Spreadsheet | [app/utils/spreadsheet.ts](../../../../app/utils/spreadsheet.ts)                                   |
| Transformer | [app/transformers/order_transformer.ts](../../../../app/transformers/order_transformer.ts)         |

## Filters

```ts
export type AdminOrderFilters = {
  search: string
  page: number
  status: string
  type: string
}

#filters(request): AdminOrderFilters {
  return {
    search: request.input('search', '') || '',
    page: Number(request.input('page', 1)) || 1,
    status: request.input('status', '') || '',
    type: request.input('type', '') || '',
  }
}
```

The `|| ''` and `|| 1` guards coerce `null`/`NaN` into safe defaults.

## The query

```ts
#adminQuery(filters: AdminOrderFilters) {
  const query = Order.query()
    .preload('transactions', (transactions) => transactions.orderBy('created_at', 'desc'))
    .orderBy('created_at', 'desc')

  if (filters.status) query.where('status', filters.status)
  if (filters.type) query.where('type', filters.type)

  if (filters.search) {
    query.where((builder) => {
      builder
        .whereILike('order_number', `%${filters.search}%`)
        .orWhereILike('customer_name', `%${filters.search}%`)
        .orWhereILike('customer_phone', `%${filters.search}%`)
    })
  }

  return query
}

listForAdmin(filters)    { return this.#adminQuery(filters).paginate(filters.page, 15) }
listAllForAdmin(filters) { return this.#adminQuery(filters) }
```

The search branch is wrapped in its own callback so the `OR` group does not leak
past the `status`/`type` conditions.

`status` and `type` are **not** validated against their enums — an unknown value
simply matches nothing.

### Index support

`orders` carries trigram GIN indexes created with the table:

```sql
CREATE INDEX orders_order_number_trgm_index   ON orders USING GIN (order_number   gin_trgm_ops);
CREATE INDEX orders_customer_name_trgm_index  ON orders USING GIN (customer_name  gin_trgm_ops);
CREATE INDEX orders_customer_phone_trgm_index ON orders USING GIN (customer_phone gin_trgm_ops);
```

No btree index can serve `ILIKE '%term%'`; trigram GIN is the one type that can.
Status and type filters are served by `['status', 'created_at']`.

## Detail

```ts
async findForAdmin(orderNumber: string): Promise<Order> {
  return Order.query()
    .where('order_number', orderNumber)
    .preload('user')
    .preload('address')
    .preload('items', (q) => q.preload('orderItems').orderBy('id', 'asc'))
    .preload('actions', (q) => q.preload('staff').orderBy('id', 'asc'))
    .preload('transactions', (q) => q.orderBy('created_at', 'desc'))
    .firstOrFail()
}
```

Not scoped by user — an admin sees any order. Rendered with the `toDetail`
transformer variant.

## Export

```ts
const exportColumns: SheetColumn<Order>[] = [
  { header: 'Nomor', value: (o) => o.orderNumber },
  { header: 'Pelanggan', value: (o) => o.customerName },
  { header: 'Telepon', value: (o) => o.customerPhone },
  { header: 'Status', value: (o) => OrderStatusLabel[o.status] },
  { header: 'Tipe', value: (o) => OrderTypeLabel[o.type] },
  { header: 'Total', value: (o) => Number(o.totalPrice ?? 0) },
  { header: 'Jadwal Jemput', value: (o) => o.pickupDate?.toISODate() ?? '' },
  { header: 'Dibuat', value: (o) => o.createdAt.toISO() ?? '' },
]
```

```ts
const orders = await this.orderService.listAllForAdmin(this.#filters(request))
const workbook = await toWorkbook('Pesanan', exportColumns, orders)

response.header('Content-Type', SPREADSHEET_CONTENT_TYPE)
response.header(
  'Content-Disposition',
  `attachment; filename="pesanan-${DateTime.now().toISODate()}.xlsx"`
)
return response.send(workbook)
```

`toWorkbook` bolds row 1, defaults column width to 20, and returns a `Buffer`
from `workbook.xlsx.writeBuffer()`.

**`listAllForAdmin` has no `.paginate()` and no limit.** Every matching row is
loaded into memory along with its preloaded transactions. Unbounded by design;
fine at current volume, worth revisiting if the table grows.

Note the `page` filter is still computed for the export path but ignored.

## Transformer variants

- List rows: `toListItem` — machine-readable dates (`toISO()`,
  `toISODate()`) because the table formats them client-side, plus
  `transactions` via `whenLoaded`.
- Detail: `toDetail` — human-formatted dates in Indonesian locale, plus address,
  items, actions, transactions, user.

## Edge cases

- **Route order matters** for `export` vs `:number`.
- **Unknown `status`/`type` values match nothing** rather than erroring.
- **`total_price` may be `null`**; the export coalesces to `0`.
- **The export is unbounded.**
- **The admin cannot mutate orders here** — no write routes exist in this
  controller.

→ One-minute version: [tldr.md](tldr.md)
→ Plain-language walkthrough: [guide.md](guide.md)
