# Dashboard — Technical

## Route

| Method | URL      | Controller              | Route name              |
| ------ | -------- | ----------------------- | ----------------------- |
| GET    | `/admin` | `admin.Dashboard.index` | `admin.dashboard.index` |

## Files

| Concern    | Path                                                                                                       |
| ---------- | ---------------------------------------------------------------------------------------------------------- |
| Controller | [app/controllers/admin/dashboard_controller.ts](../../../../app/controllers/admin/dashboard_controller.ts) |
| Service    | [app/services/analytics_service.ts](../../../../app/services/analytics_service.ts)                         |
| Page       | `inertia/pages/admin/index.tsx`                                                                            |

The controller is 18 lines — it destructures `recentOrders` out to run it through
`OrderTransformer` and spreads the rest.

## Constants

```ts
const TREND_DAYS = 14
const PICKUP_DAYS = 7
const RECENT_ORDERS = 8

const ACTIVE_STATUSES: OrderStatus[] = [
  PICKUP_SCHEDULED,
  IN_PICKUP,
  IN_INSPECTION,
  AWAITING_PAYMENT,
  IN_CLEANING,
  CLEANING_DONE,
  IN_DELIVERY,
]
```

`ACTIVE_STATUSES` excludes `COMPLETED` and `CANCELLED`.

## Parallel assembly

```ts
async dashboard() {
  const [summary, statusBreakdown, typeSplit, revenueTrend, pickupLoad, recentOrders] =
    await Promise.all([
      this.#summary(),
      this.#statusBreakdown(),
      this.#typeSplit(),
      this.#revenueTrend(),
      this.#pickupLoad(),
      Order.query().orderBy('created_at', 'desc').limit(RECENT_ORDERS),
    ])

  return { summary, statusBreakdown, typeSplit, revenueTrend, pickupLoad, recentOrders }
}
```

`#summary` itself runs six more queries in parallel — counts, revenue, and a
grouped role count.

## Revenue

```ts
async #paidRevenue(): Promise<number> {
  const row = await db.from('transactions')
    .join('orders', 'orders.id', 'transactions.order_id')
    .where('transactions.status', TransactionStatus.PAID)
    .sum('orders.total_price as total')
    .first()
  return Math.round(Number(row?.total ?? 0))
}
```

Sums `orders.total_price` across the join, so **one settled transaction per
order is required for correctness**. That invariant is enforced by the partial
unique index `transactions_order_id_paid_unique` — see
[customer/payment](../../customer/payment/technical.md).

## Breakdowns fill their domain

```ts
async #statusBreakdown(): Promise<Breakdown[]> {
  const rows = await db.from('orders').select('status').count('* as total').groupBy('status')
  const totals = new Map(rows.map((row) => [row.status as string, Number(row.total)]))

  return Object.values(OrderStatus).map((status) => ({
    value: status,
    label: OrderStatusLabel[status],
    total: totals.get(status) ?? 0,
  }))
}
```

Iterating the **enum** rather than the query result guarantees every status
appears, zero-filled. `#typeSplit` does the same for `OrderType`.

## Revenue trend

```ts
const start = DateTime.now()
  .minus({ days: TREND_DAYS - 1 })
  .startOf('day')

const rows = await db
  .from('transactions')
  .join('orders', 'orders.id', 'transactions.order_id')
  .where('transactions.status', TransactionStatus.PAID)
  .where('transactions.created_at', '>=', start.toJSDate())
  .select(db.raw(`date(transactions.created_at) as day`))
  .sum('orders.total_price as total')
  .groupByRaw('date(transactions.created_at)')

return this.#fillDays(start, TREND_DAYS, this.#toDayTotals(rows))
```

`#fillDays` builds an array of exactly `days` entries from `start`, defaulting
missing days to `0` — so the series is dense.

Served by the composite index `['status', 'created_at']` on `transactions`.

## Pickup load

```ts
const rows = await db
  .from('orders')
  .whereNotNull('pickup_date')
  .where('pickup_date', '>=', start.toSQLDate()!)
  .where('pickup_date', '<', start.plus({ days: PICKUP_DAYS }).toSQLDate()!)
  .whereNot('status', OrderStatus.CANCELLED)
  .select('pickup_date')
  .count('* as total')
  .groupBy('pickup_date')
```

Each of the 7 returned entries carries `{ date, label, booked, capacity }` with
`capacity: DAILY_PICKUP_LIMIT` (10) imported from `order_service`.

Note this excludes only `CANCELLED`, so it counts orders in any live stage — a
broader set than the `#assertPickupCapacity` check, which counts only
`pickup_scheduled`. **The dashboard's "booked" and the booking limit are not the
same number.**

Served by `['status', 'pickup_date']`.

## Helpers

```ts
#toDayTotals(rows) // Map<ISO date, rounded total>
#fillDays(start, days, totals) // dense SeriesPoint[] with 'd MMM' labels, locale 'id'
#count(query) // Number(row?.total ?? 0)
```

Labels use `setLocale('id')`.

## Edge cases

- **`total_price` is nullable**; sums coalesce via `Number(x ?? 0)` and round.
- **`recentOrders` has no preloads**, so the transformer's `whenLoaded` relations
  come back empty — the default `toObject` variant does not need them.
- **Timezone**: `date(transactions.created_at)` groups in the database's
  timezone, while `#fillDays` builds days from the app's Luxon `DateTime.now()`.
  A mismatch shifts bucket boundaries.
- **Dashboard "booked" ≠ booking-limit "booked"** as described above.

→ One-minute version: [tldr.md](tldr.md)
→ Plain-language walkthrough: [guide.md](guide.md)
