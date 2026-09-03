# Reports — Technical

## Routes

| Method | URL                     | Controller            | Route name            |
| ------ | ----------------------- | --------------------- | --------------------- |
| GET    | `/admin/reports/export` | `admin.Report.export` | `admin.report.export` |
| GET    | `/admin/reports`        | `admin.Report.index`  | `admin.report.index`  |

`export` is registered first, as with orders.

## Files

| Concern     | Path                                                                                                 |
| ----------- | ---------------------------------------------------------------------------------------------------- |
| Controller  | [app/controllers/admin/report_controller.ts](../../../../app/controllers/admin/report_controller.ts) |
| Service     | [app/services/analytics_service.ts](../../../../app/services/analytics_service.ts)                   |
| Validator   | `reportRangeValidator` in [admin_validator.ts](../../../../app/validators/admin_validator.ts)        |
| Spreadsheet | [app/utils/spreadsheet.ts](../../../../app/utils/spreadsheet.ts)                                     |

## Range resolution

```ts
const DEFAULT_RANGE_DAYS = 30

async #range(request) {
  const payload = await request.validateUsing(reportRangeValidator)

  const to = payload.to ?? DateTime.now()
  const from = payload.from ?? to.minus({ days: DEFAULT_RANGE_DAYS - 1 })

  return from <= to ? { from, to } : { from: to, to: from }
}
```

`reportRangeValidator` is `{ from?: date, to?: date }` — both optional. A
reversed range is **swapped, not rejected**.

`AnalyticsService.report` then normalises:

```ts
const start = from.startOf('day')
const end = to.endOf('day')
```

## Assembly

```ts
const [totals, series, byPaymentMethod, byType, topServices] = await Promise.all([
  this.#reportTotals(start, end),
  this.#reportSeries(start, end),
  this.#reportByPaymentMethod(start, end),
  this.#reportByType(start, end),
  this.#topServices(start, end),
])
```

Returned shape adds `from`/`to` ISO dates, a localised `label`, `totalRevenue`,
`paidOrders`, and:

```ts
averageOrderValue: totals.orders === 0 ? 0 : Math.round(totals.revenue / totals.orders)
```

## The shared base query

```ts
#paidQuery(start, end) {
  return db.from('transactions')
    .join('orders', 'orders.id', 'transactions.order_id')
    .where('transactions.status', TransactionStatus.PAID)
    .whereBetween('transactions.created_at', [start.toJSDate(), end.toJSDate()])
}
```

Every money figure builds on this. Because it sums `orders.total_price` across
the join, **one settled transaction per order is required** — guaranteed by
`transactions_order_id_paid_unique`.

```ts
#reportTotals: .sum('orders.total_price as revenue').countDistinct('orders.id as orders')
```

`countDistinct` protects the order count; the partial unique index protects the
sum.

## Series

```ts
const days = Math.max(1, Math.ceil(end.diff(start, 'days').days))
return this.#fillDays(start, days, this.#toDayTotals(rows))
```

With `start` at `startOf('day')` and `end` at `endOf('day')`, a single day gives
`diff ≈ 0.9999` → `ceil` → `1`. Two days → `1.9999` → `2`. Correct at both ends.

`#fillDays` zero-fills gaps, so the series is dense.

## Breakdowns

`#reportByPaymentMethod` and `#reportByType` group the base query, then map over
the **enum** so every value appears zero-filled:

```ts
return Object.values(PaymentMethod).map((method) => ({
  value: method,
  label: PaymentMethodLabel[method],
  orders: Number(totals.get(method)?.orders ?? 0),
  revenue: Math.round(Number(totals.get(method)?.revenue ?? 0)),
}))
```

## Top services

```ts
const rows = await db
  .from('order_items')
  .join('orders', 'orders.id', 'order_items.order_id')
  .join('transactions', 'transactions.order_id', 'orders.id')
  .join('catalogues', 'catalogues.id', 'order_items.catalogue_id')
  .where('transactions.status', TransactionStatus.PAID)
  .whereBetween('transactions.created_at', [start.toJSDate(), end.toJSDate()])
  .select('catalogues.id', 'catalogues.name', 'catalogues.category')
  .sum('order_items.subtotal as revenue')
  .count('order_items.id as orders')
  .groupBy('catalogues.id', 'catalogues.name', 'catalogues.category')
  .orderByRaw('sum(order_items.subtotal) desc')
  .limit(10)
```

**`count('order_items.id as orders')` counts service lines, not orders.** The
alias `orders` is misleading — an order with three services contributes three.
Not comparable to `paidOrders`.

This one sums `order_items.subtotal` rather than `orders.total_price`, so it is
not exposed to the join-fanout concern the other figures are.

## Export

```ts
const exportColumns: SheetColumn<SeriesRow>[] = [
  { header: 'Tanggal', value: (row) => row.date },
  { header: 'Pendapatan', value: (row) => row.total },
]

const report = await this.analyticsService.report(from, to)
const workbook = await toWorkbook('Pendapatan', exportColumns, report.series)

response.header(
  'Content-Disposition',
  `attachment; filename="laporan-${report.from}-${report.to}.xlsx"`
)
```

**Only `report.series` is exported.** The breakdowns are computed (the full
`report()` runs) but discarded for the file.

## Index support

- `transactions` → `['status', 'created_at']` serves the base query's filter.
- `order_items` → `catalogue_id` and the composite `['catalogue_id', 'item_id']`
  serve the top-services joins.

## Edge cases

- **A reversed range is silently swapped.**
- **No upper bound on range length** — a multi-year range groups over everything
  and `#fillDays` builds one entry per day.
- **`topServices`' `orders` is a line count.**
- **Export computes the breakdowns then throws them away.**
- **Timezone**: grouping uses `date(transactions.created_at)` in the database's
  timezone, while `#fillDays` builds days from Luxon in the app's — a mismatch
  shifts bucket edges.
- **Manual reconciliations count** under whichever method the admin chose.

→ One-minute version: [tldr.md](tldr.md)
→ Plain-language walkthrough: [guide.md](guide.md)
