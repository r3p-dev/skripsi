# Admin — Order Monitor

Every order in the shop, online and walk-in, with the full audit trail behind
each one. This is the screen someone opens when a customer phones to ask what is
happening.

**Code:** [`OrderService.getMonitoredOrders` / `getMonitoredOrdersForExport`](../../app/services/order_service.ts) ·
[`admin/order_controller.ts`](../../app/controllers/admin/order_controller.ts) ·
pages [`admin/order/index.tsx`](../../inertia/pages/admin/order/index.tsx),
[`admin/order/show.tsx`](../../inertia/pages/admin/order/show.tsx)

---

## 1. Two list methods, deliberately separate

`OrderService` has both `getAllOrders` (customer) and `getMonitoredOrders`
(admin), and they are not the same query:

```ts
/**
 * Kept apart from `getAllOrders` because the two answer different
 * questions: that one is a customer looking through their own history and
 * is always scoped to them, this one is an operator looking at the shop.
 */
```

| | `getAllOrders` (customer)                       | `getMonitoredOrders` (admin)                      |
| --- | ---------------------------------------------- | ------------------------------------------------- |
| Scope | always `where user_id = me`                   | **none** — the whole shop                          |
| Search | prefix on order number, plus a filtered address preload | contains-match across number, name, phone   |
| Filters | none                                          | status, type                                       |

> **Why not one method with flags:** the customer version's ownership scope is a
> security boundary. A shared method with an optional `user` argument invites the
> bug where someone forgets to pass it and quietly exposes the shop. Keeping the
> admin query separate makes the unscoped one obviously, deliberately unscoped.

---

## 2. The query

```ts
private monitoredOrdersQuery(filters: OrderFilters) {
  const searchTerm = `%${filters.search}%`

  return Order.query()
    .if(filters.search, (query) => {
      query.where((matches) => {
        matches.whereILike('order_number', searchTerm)
          .orWhereILike('customer_name', searchTerm)
          .orWhereILike('customer_phone', searchTerm)
      })
    })
    .if(filters.status, (query) => query.where('status', filters.status))
    .if(filters.type,   (query) => query.where('type',   filters.type))
    .orderBy('created_at', 'desc')
}
```

Three things to note.

**Search is `%term%`, not `term%`.** The customer searches a number they are
looking at; an admin is on the phone with someone who says "Budi, 0812…" and
needs a contains-match across three columns.

**The `orWhere` chain is wrapped in `.where((matches) => …)`.** Without the
grouping, `status = X AND number LIKE … OR name LIKE …` would parse as
`(status AND number) OR name`, and a status filter would silently stop applying to
name matches. This is the classic SQL precedence bug, avoided by construction.

**Search matches on the copied `customer_name`/`customer_phone`,** not on the
joined user account. That is what makes walk-in orders — which have no account —
searchable by the same box.

### One builder, two consumers

```ts
async getMonitoredOrders(filters)          { return this.monitoredOrdersQuery(filters).preload('address').paginate(filters.page, 10) }
async getMonitoredOrdersForExport(filters) { return this.monitoredOrdersQuery(filters).preload('address').preload('transactions', q => q.orderBy('created_at','desc')).limit(EXPORT_ROW_LIMIT) }
```

The export is the **same list**, unpaginated, plus transactions (the file has room
for a payment column the table does not). See [exports.md](exports.md) for why
the export must never be "the page you happened to be on".

---

## 3. Filter handling

```ts
const STATUS_OPTIONS = Object.values(OrderStatus).map((status) => ({ value: status, label: OrderStatusLabel[status] }))
const TYPE_OPTIONS   = Object.values(OrderType).map((type) => ({ value: type, label: OrderTypeLabel[type] }))
```

Built from the enums, so **a new status appears in the filter the day it is
added** — no second list to remember.

```ts
private filtersFrom(query: Record<string, unknown>): OrderFilters {
  const status = String(query.status ?? '')
  const type   = String(query.type   ?? '')

  return {
    page:   Number(query.page) || 1,
    search: String(query.search ?? '').trim(),
    status: STATUS_OPTIONS.some((o) => o.value === status) ? status : '',
    type:   TYPE_OPTIONS.some((o)   => o.value === type)   ? type   : '',
  }
}
```

> **Why validate against the options:** a status the query string made up would
> produce an empty list *with an unknown filter shown as active* — the admin sees
> zero orders and no obvious reason. Dropping the unknown value silently falls
> back to "all", which is the harmless interpretation of a hand-edited URL.

The filters are raw enum values, not Indonesian labels, because they have to
survive a round trip through the query string — which is exactly why
`OrderFilters` is documented as such in
[`shared.ts`](../../app/validators/shared.ts).

`index` and `export` both call `filtersFrom`, so the file always matches the
screen. The **only** thing the export ignores is `page`.

---

## 4. Order detail

`GET /admin/orders/:number`

```ts
const order = await this.orderService.getOrderByNumber(orderNumber)   // ← no user scope

return inertia.render('admin/order/show', {
  order:   OrderTransformer.transform(order),
  items:   OrderItemTransformer.transform(order.items).depth(2),
  actions: OrderActionTransformer.transform(order.actions).depth(2),
})
```

The same `getOrderByNumber` the customer uses, called without a `user` argument —
one method, three roles, and the scope is the only difference.

### Why `.depth(2)` and separate props

Nested transformers stop at one level by default. The lines need their **item**
and their **service**; the actions need the **staff member** who recorded them.
Sending them as top-level props with explicit depth is clearer than trying to
make one nested transform produce a three-level tree.

### The audit trail

This is the only screen in the product that renders `order_actions` in full —
every claim, every release, every completion, every item correction, every
payment override, each with the staff member's name and the timestamp:

| Action                          | What the admin learns                                   |
| ------------------------------- | ------------------------------------------------------- |
| `attempt_*` / `release_*`       | Who picked the task up, and who abandoned it            |
| `pickup` / `delivery` / `inspection` / `cleaning_done` | Who did the work, when, with the photo |
| `items_edited`                  | The order was repriced after inspection, and by whom    |
| `payment_override`              | An admin forced the payment, **with their stated reason** |
| `offline_order`                 | It was a counter order, with the counter note           |

The customer's own order page filters this down to three milestones. The admin
sees everything — that asymmetry is the point of having the log.

Proof photos are rendered from the signed URLs stored in `photo_path`.
⚠️ Those expire after 90 days; see
[architecture.md §7](../architecture.md#7-file-storage).

---

## 5. What an admin cannot do here

The monitor is **read-only**. There is no route to change an order's status,
edit its items, cancel it, or reassign a task. The only order mutation available
to an admin anywhere in the product is
[reconciliation](reconciliation.md), and that one is heavily constrained and
logged.

> **Why:** every status change in this system is a claim about something physical
> — the shoes were collected, they were washed, they were handed over. An admin
> at a desk cannot know those things, and a status set from the office would
> break the meaning of every downstream figure. Corrections go through the person
> holding the shoes.

---

## 6. Export columns

Wider than the on-screen table, because a file is read away from the app:

`Nomor · Tipe · Status · Pelanggan · Telepon · Alamat · Tanggal Jemput · Dibuat ·
Status Pembayaran · Metode Pembayaran · Total`

Payment state comes from the **most recent** transaction (`order.transactions.at(0)`,
valid because the export preloads them newest-first). Money is written as a real
number with a Rupiah format and dates as real dates, so the columns can be summed
and sorted in Excel — see [exports.md](exports.md).

---

## 7. Where to change things

| To change…                       | Edit                                                                   |
| -------------------------------- | ---------------------------------------------------------------------- |
| Searchable columns               | `monitoredOrdersQuery`                                                 |
| Add a filter                     | `OrderFilters` + an options array + `filtersFrom` + the query           |
| Page size                        | `.paginate(filters.page, 10)`                                          |
| Badge colours                    | `orderStatusStyles` in [`inertia/lib/constants.ts`](../../inertia/lib/constants.ts) |
| Export columns                   | `ORDER_COLUMNS` in [`admin/order_controller.ts`](../../app/controllers/admin/order_controller.ts) |
