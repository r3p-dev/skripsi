# Admin — Revenue Reporting

The screen that answers "how did we do, and which services actually earn". Unlike
the dashboard it takes a date range, and every figure on it is restricted to work
that was actually paid for.

**Code:** [`report_service.ts`](../../app/services/report_service.ts) ·
[`admin/report_controller.ts`](../../app/controllers/admin/report_controller.ts) ·
[`report_validator.ts`](../../app/validators/report_validator.ts) ·
page [`admin/report/index.tsx`](../../inertia/pages/admin/report/index.tsx)

---

## 1. The governing rule

```ts
/**
 * Every figure is restricted to orders that were actually paid for. An order
 * still awaiting payment is work in progress, not revenue, and counting it
 * would overstate every total on the page.
 */
```

That is enforced by a single shared base query:

```ts
private paidOrders(from: DateTime, to: DateTime) {
  return db.from('orders')
    .join('transactions', 'transactions.order_id', 'orders.id')
    .where('transactions.status', TransactionStatus.PAID)
    .whereBetween('orders.created_at', [from.toSQL()!, to.endOf('day').toSQL()!])
}
```

Four of the five sections build on it, so they cannot disagree about what counts.

⚠️ **The join can duplicate an order.** If an order was charged more than once
and more than one charge settled, it appears twice. That is why every count is
`countDistinct('orders.id')`.

⚠️ **Revenue sums are `sum('orders.total_price')` over that join**, so a
double-settled order would have its total counted twice. In practice a second
settlement does not happen — the pending-transaction reuse and the partial unique
index make it very unlikely — but it is a real difference from the dashboard,
which sums with `whereIn('id', paidOrderIds())` and therefore counts each order
exactly once. If the two screens ever disagree by an exact multiple of one
order's total, this is why.

**Dated by `orders.created_at`, not by settlement time** — same reasoning as the
dashboard trend: a payment that lands the next morning still belongs to the day
the work was taken in.

---

## 2. The range

```ts
export const reportValidator = vine.create({
  from: vine.date().optional(),
  to:   vine.date().optional(),
})
```

```ts
resolveRange(range: ReportRange) {
  const to   = (range.to   ?? DateTime.now()).startOf('day')
  const from = (range.from ?? to.minus({ days: DEFAULT_RANGE_DAYS - 1 })).startOf('day')

  return from > to ? { from: to, to: from } : { from, to }     // swap if reversed
}
```

- **Both ends optional** — opening the page with no query string gives the last
  30 days rather than an error. 30 days because that is the period the shop
  settles its own books over.
- **Reversed dates are swapped**, not rejected: a range typed the wrong way round
  is obviously a typo, and an empty report is a worse answer than the report they
  meant.
- The range is read **from the query string**, not a POST body:

```ts
const range = await reportValidator.validate(request.qs())
```

> **Why:** a report has to be linkable and bookmarkable to be worth anything.
> `?from=2026-07-01&to=2026-07-31` is a URL you can paste into a message.

`resolveRange` is covered by
[`tests/unit/report_service.spec.ts`](../../tests/unit/report_service.spec.ts).

---

## 3. The five sections

All five are fetched in parallel by `getReport`.

### 3.1 Totals

```ts
const rows = await this.paidOrders(from, to).sum('orders.total_price as revenue').countDistinct('orders.id as orders')
```

Yields **Total Pendapatan**, **Pesanan Terbayar**, and:

```ts
averageOrderValue: formatRupiah(totals.orders > 0 ? Math.round(totals.revenue / totals.orders) : 0)
```

Guarded against divide-by-zero on an empty window, and rounded to whole Rupiah.

### 3.2 Daily series

Same `buildDailySeries` helper as the dashboard trend, so quiet days are filled
with zeros rather than omitted. See
[dashboard.md §2.5](dashboard.md#25-revenue-trend--14-days) for why that matters.

### 3.3 By payment method

```ts
const rows = await this.paidOrders(from, to)
  .select('transactions.payment_method')
  .sum('orders.total_price as revenue')
  .countDistinct('orders.id as orders')
  .groupBy('transactions.payment_method')

return Object.values(PaymentMethod).map((method) => ({ ...totals.get(method) ?? zeros }))
```

> **Why this breakdown exists:** cash and debit are recorded at the counter, QRIS
> comes back from Midtrans. The mix is what tells an admin how much money should
> physically be in the shop at the end of the day, versus how much is in the
> Midtrans account.

Built by mapping the **enum**, so a method with no revenue still appears as zero
and the table does not reshuffle between periods.

### 3.4 By order type

Identical construction over `OrderType` — how much of the business is walk-in
versus app-booked, in money rather than in counts (which is what the dashboard
shows).

### 3.5 Top services

The only section that does **not** use the shared base query, because it has to
reach through `order_items`:

```ts
db.from('order_items')
  .join('orders',       'orders.id',                'order_items.order_id')
  .join('services',     'services.id',              'order_items.service_id')
  .join('transactions', 'transactions.order_id',    'orders.id')
  .select('services.id', 'services.name', 'services.category')
  .sum('order_items.subtotal as revenue')
  .count('order_items.id as orders')
  .where('transactions.status', TransactionStatus.PAID)
  .whereBetween('orders.created_at', [from.toSQL()!, to.endOf('day').toSQL()!])
  .groupBy('services.id', 'services.name', 'services.category')
  .orderBy('revenue', 'desc')
  .limit(TOP_SERVICE_LIMIT)      // 5
```

Two things to understand:

**Revenue is summed from `order_items.subtotal`, not from `services.price`.**

> **Why:** a line keeps the price it was quoted at. Reading the catalogue's
> current price would rewrite history every time an admin adjusts a price — last
> quarter's "Deep Clean" revenue would change because of a decision made this
> week. See [catalogue.md §2](catalogue.md#2-prices-are-current-asking-prices-never-historical-ones).

**"Terjual" counts `order_items` rows, not orders.** One order with five pairs of
shoes each needing a deep clean counts as five. That is the right unit for a
service ranking — you want to know how many times the service was performed.

`services.name` and `category` come from the **live** catalogue via the join, so
a renamed service shows its new name here while old receipts keep the old one.

Top 5 only: beyond that the tail is noise for a catalogue of this size.

---

## 4. Export

`GET /admin/reports/export` reads the range exactly as `index` does, so the file
covers the window on screen. Five sheets, one per section:

| Sheet               | Columns                                          |
| ------------------- | ------------------------------------------------ |
| Ringkasan           | Metric / value — the headline figures            |
| Pendapatan Harian   | Date × revenue                                   |
| Metode Pembayaran   | Method × orders × revenue                        |
| Tipe Pesanan        | Type × orders × revenue                          |
| Layanan Terlaris    | Service × category × sold × revenue              |

> **Why five sheets rather than one stacked file:** each section has its own
> columns. A single sheet holding all five would be a shape no spreadsheet can
> sort, filter or chart.

One deliberate inconsistency: the **Ringkasan sheet writes formatted strings**
(`"Rp 1.200.000"`, `"1 Juli 2026 — 31 Juli 2026"`) while every other sheet writes
raw numbers with a currency format.

> **Why:** a summary is six rows nobody adds up, and it reads as a report. The
> data sheets are columns people sum and sort, and those must be real numbers —
> see [exports.md](exports.md).

---

## 5. Reading the numbers correctly

| Question                                        | Answer                                                                        |
| ----------------------------------------------- | ----------------------------------------------------------------------------- |
| Does an unpaid order count?                     | No, in any section.                                                            |
| Does a cancelled order count?                   | No — it was never paid.                                                        |
| Which date decides the period?                  | `orders.created_at`, never the payment date.                                   |
| Do walk-ins count?                              | Yes — they carry a `paid` transaction from the moment they are created.        |
| Does a manually reconciled order count?         | Yes. The override writes a real `paid` transaction, deliberately indistinguishable from a normal one. |
| Do the dashboard and the report agree?          | Normally yes; see the duplicate-join caveat in §1.                             |
| Are refunds subtracted?                         | There are no refunds in the system.                                            |

---

## 6. Where to change things

| To change…                          | Edit                                                              |
| ----------------------------------- | ----------------------------------------------------------------- |
| Default window (30 days)            | `DEFAULT_RANGE_DAYS`                                              |
| Top-services depth (5)              | `TOP_SERVICE_LIMIT`                                               |
| What counts as revenue              | `paidOrders()` — changes four of the five sections at once        |
| Date by settlement instead          | `whereBetween` on `orders.created_at` → `transactions.updated_at`, in `paidOrders()` **and** `getTopServices` |
| Remove the double-count risk        | Restructure `paidOrders()` to `whereIn('orders.id', paidOrderIds())` the way the dashboard does |
| Add a section                       | A private method + an entry in the `Promise.all` + a sheet in the export |
