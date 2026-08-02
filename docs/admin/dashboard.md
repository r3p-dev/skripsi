# Admin — Dashboard

The owner's home screen. Six panels, all read-only aggregation over data other
parts of the app already wrote.

**Code:** [`dashboard_service.ts`](../../app/services/dashboard_service.ts) ·
[`admin/dashboard_controller.ts`](../../app/controllers/admin/dashboard_controller.ts) ·
[`utils/series.ts`](../../app/utils/series.ts) ·
page [`admin/index.tsx`](../../inertia/pages/admin/index.tsx)

---

## 1. Shape of the feature

```ts
// DashboardController — one read, used by both the screen and the export
private read() {
  return Promise.all([
    this.dashboardService.getSummary(),
    this.dashboardService.getStatusBreakdown(),
    this.dashboardService.getTypeSplit(),
    this.dashboardService.getRevenueTrend(),
    this.dashboardService.getPickupLoad(),
    this.dashboardService.getRecentOrders(),
  ])
}
```

`index` renders those six; `export` turns the same six into a six-sheet workbook.

> **Why share one method:** an export that quietly computed things differently
> from the screen would be worse than no export at all — someone would take the
> file into a meeting and quote a number the app never showed. One `read()` makes
> disagreement impossible.

`DashboardService` writes nothing. It is pure aggregation, mostly through the
query builder (`db.from(...)`) rather than models, because it needs `GROUP BY`
and `SUM` rather than hydrated objects.

---

## 2. Panel by panel

### 2.1 Summary — the headline figures

```ts
const [orderCounts, revenue, userCounts] = await Promise.all([
  db.from('orders').select('status').count('* as total').groupBy('status'),
  this.getRevenueTotal(),
  db.from('users').select('role').count('* as total').groupBy('role'),
])
```

Three queries in parallel, then everything is derived in memory:

| Figure                | Derivation                                                        |
| --------------------- | ----------------------------------------------------------------- |
| Total Pesanan         | sum of all status counts                                          |
| Pesanan Berjalan      | sum of the six `ACTIVE_STATUSES`                                  |
| Pesanan Selesai       | count of `completed`                                              |
| Menunggu Pelunasan    | count of `awaiting_payment`                                       |
| Pendapatan            | `getRevenueTotal()`, formatted; `revenueValue` carries the raw number |
| Pelanggan / Petugas   | counts from the role grouping                                     |

```ts
const ACTIVE_STATUSES = [PICKUP_SCHEDULED, IN_PICKUP, IN_INSPECTION, AWAITING_PAYMENT, IN_CLEANING, IN_DELIVERY]
```

"In progress" means *still moving through the shop* — everything except
`completed` and `cancelled`. Cancelled orders are counted in the total (they
happened) but not in active work.

Both a formatted string and a raw number are returned (`revenue` / `revenueValue`)
because the screen prints the first and the export needs the second — see
[exports.md](exports.md).

### 2.2 Revenue — the definition everything else inherits

```ts
async getRevenueTotal(): Promise<number> {
  const result = await db.from('orders').sum('total_price as total').whereIn('id', this.paidOrderIds())
  return Number(result[0]?.total ?? 0)
}

private paidOrderIds() {
  return db.from('transactions').select('order_id').where('status', TransactionStatus.PAID).distinct()
}
```

> **Why sum `orders.total_price` rather than transaction amounts:** an order can
> carry several transaction rows. A QRIS charge that expired and was retried
> leaves two rows for one order, and only one payment ever changed hands. Summing
> the order's own total, restricted to orders that have *at least one* paid
> transaction, counts each order exactly once.

`paidOrderIds()` is a shared private sub-query so no two revenue figures on the
page can disagree about what "paid" means.

⚠️ Note this counts an order's **full total** as revenue as soon as any paid
transaction exists. There is no partial payment concept in the system, so that
holds — but it is an assumption, not a guarantee.

### 2.3 Status breakdown

```ts
return Object.values(OrderStatus).map((status) => ({
  value: status,
  label: OrderStatusLabel[status],
  total: totals.get(status) ?? 0,
}))
```

Built by mapping the **enum**, not the query result. Two consequences, both
wanted:

- Statuses with zero orders still appear, as zero. A chart that omits empty
  categories reshuffles itself as data arrives.
- The order is **lifecycle order** (as declared in the enum), not descending by
  size, so the chart reads as the pipeline it describes.
- Adding a status to the enum makes it appear here automatically.

Each slice carries both `value` (raw, for colour keying via `orderStatusStyles`)
and `label` (Indonesian, for printing).

### 2.4 Online vs. offline split

Same construction over `OrderType`. This panel is the reason `orders.type` exists
as a column at all — it answers "how much of the business walks in?"

### 2.5 Revenue trend — 14 days

```ts
const REVENUE_TREND_DAYS = 14

const rows = await db.from('orders')
  .select(db.raw(`to_char(orders.created_at, 'YYYY-MM-DD') as date`))
  .sum('orders.total_price as total')
  .whereIn('orders.id', this.paidOrderIds())
  .where('orders.created_at', '>=', from.toSQL()!)
  .groupByRaw(`to_char(orders.created_at, 'YYYY-MM-DD')`)

return buildDailySeries(rows.map(...), from, to)
```

Two decisions:

**Dated by `orders.created_at`, not by when payment settled.**

> **Why:** a payment that lands the next morning still belongs to the day the
> work was taken in. Dating by settlement would make Monday's takings appear on
> Tuesday and turn every late-evening order into a rounding problem across the
> day boundary.

**Gaps are filled with zeros** by `buildDailySeries`:

```ts
// utils/series.ts
const totalsByDate = new Map(rows.map((row) => [row.date, Number(row.total)]))

return eachDay(from, to).map((date) => ({
  date,
  label: DateTime.fromISO(date).setLocale('id').toFormat('d LLL'),   // "28 Jul"
  total: totalsByDate.get(date) ?? 0,
}))
```

> **Why it matters:** a chart drawn straight from grouped SQL silently omits quiet
> days, which stretches the remaining ones across the axis and makes a week with
> two orders look as busy as a week with fourteen. Filling with zeros is what
> makes the shape of the line honest.

The same helper is used by the revenue report, so the two charts behave
identically. It is covered by [`tests/unit/series.spec.ts`](../../tests/unit/series.spec.ts).

### 2.6 Pickup load — 7 days ahead

```ts
const PICKUP_FORECAST_DAYS = 7

const rows = await db.from('orders')
  .select(db.raw(`to_char(pickup_date, 'YYYY-MM-DD') as date`))
  .count('* as total')
  .where('status', OrderStatus.PICKUP_SCHEDULED)
  .whereBetween('pickup_date', [from.toISODate()!, to.toISODate()!])
  .groupByRaw(...)

return eachDay(from, to).map((date) => ({
  date,
  label: DateTime.fromISO(date).setLocale('id').toFormat('d LLL'),
  booked: booked.get(date) ?? 0,
  capacity: DAILY_PICKUP_LIMIT,          // imported from OrderService
}))
```

The only **forward-looking** panel on the dashboard.

> **Why it exists:** `DAILY_PICKUP_LIMIT` is enforced at booking time — the
> eleventh customer for a day is refused. This panel is how an admin sees a day
> filling up *before* that happens and can decide to add a shift.

`capacity` is imported from `OrderService`, not restated, so the chart cannot
show a limit different from the one actually enforced.

Note it counts only `pickup_scheduled` — matching the capacity check exactly, so
the chart and the rule agree. An order already claimed (`in_pickup`) drops out of
both. See [customer/order.md §2](../customer/order.md#2-daily-pickup-capacity).

### 2.7 Recent orders

```ts
Order.query().orderBy('created_at', 'desc').limit(5)
```

> **Why:** so the dashboard opens on something *happening* rather than on a wall
> of totals. Whichever way the order arrived, online or walk-in.

---

## 3. Export

`GET /admin/dashboard/export` produces a six-sheet workbook:

| Sheet                | Contents                                              |
| -------------------- | ----------------------------------------------------- |
| Ringkasan            | The seven headline figures as label/value rows         |
| Pesanan per Status   | Status × count                                        |
| Online vs Offline    | Type × count                                          |
| Tren Pendapatan      | Date × revenue (real dates, real currency numbers)     |
| Beban Penjemputan    | Date × booked × capacity × **remaining**              |
| Pesanan Terbaru      | The five most recent orders                           |

> **Why export a dashboard at all:** charts are not something an admin can paste
> into a report; the numbers behind them are. The "Sisa" (remaining) column in the
> pickup sheet is computed in the export only — on screen the gap is visible from
> the bar, in a spreadsheet it needs to be a column you can sort by.

Two `breakdownSheet` helpers exist — one here, one in the report controller —
because the two have different column shapes (count vs. count + revenue). Same
idea, different data.

Mechanics of `sheet()`, `excelDate()` and `excelNumber()` are in
[exports.md](exports.md).

---

## 4. Not on the dashboard, and why

- **No date-range picker.** The summary is lifetime, the trend is fixed at 14
  days, the forecast at 7. Ranged analysis lives in
  [reports.md](reports.md), which is the screen built for it.
- **No live updates.** The page reflects the moment it loaded. Transmit is used
  only for the payment screen.
- **No per-staff productivity.** The data exists (`order_actions.staff_id`) and
  `ProfileService.getCompletedTaskCount` already counts it per person, but no
  admin screen aggregates it.

---

## 5. Where to change things

| To change…                       | Edit                                                                 |
| -------------------------------- | -------------------------------------------------------------------- |
| Trend window (14 days)           | `REVENUE_TREND_DAYS`                                                 |
| Forecast window (7 days)         | `PICKUP_FORECAST_DAYS`                                               |
| What counts as "in progress"     | `ACTIVE_STATUSES`                                                    |
| What counts as revenue           | `paidOrderIds()` — changes every figure on the page at once          |
| Recent-orders count              | `getRecentOrders(limit = 5)`                                         |
| Daily capacity                   | `DAILY_PICKUP_LIMIT` in [`order_service.ts`](../../app/services/order_service.ts) — the chart follows |
