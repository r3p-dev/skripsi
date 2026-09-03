# Laporan — Teknis

## Route

| Method | URL                     | Controller            | Nama route            |
| ------ | ----------------------- | --------------------- | --------------------- |
| GET    | `/admin/reports/export` | `admin.Report.export` | `admin.report.export` |
| GET    | `/admin/reports`        | `admin.Report.index`  | `admin.report.index`  |

`export` didaftarkan lebih dulu, seperti pada pesanan.

## Berkas

| Bagian       | Path                                                                                                 |
| ------------ | ---------------------------------------------------------------------------------------------------- |
| Controller   | [app/controllers/admin/report_controller.ts](../../../../app/controllers/admin/report_controller.ts) |
| Service      | [app/services/analytics_service.ts](../../../../app/services/analytics_service.ts)                   |
| Validator    | `reportRangeValidator` di [admin_validator.ts](../../../../app/validators/admin_validator.ts)        |
| Lembar sebar | [app/utils/spreadsheet.ts](../../../../app/utils/spreadsheet.ts)                                     |

## Penentuan rentang

```ts
const DEFAULT_RANGE_DAYS = 30

async #range(request) {
  const payload = await request.validateUsing(reportRangeValidator)

  const to = payload.to ?? DateTime.now()
  const from = payload.from ?? to.minus({ days: DEFAULT_RANGE_DAYS - 1 })

  return from <= to ? { from, to } : { from: to, to: from }
}
```

`reportRangeValidator` adalah `{ from?: date, to?: date }` — keduanya opsional.
Rentang terbalik **ditukar, bukan ditolak**.

`AnalyticsService.report` lalu menormalkan:

```ts
const start = from.startOf('day')
const end = to.endOf('day')
```

## Perakitan

```ts
const [totals, series, byPaymentMethod, byType, topServices] = await Promise.all([
  this.#reportTotals(start, end),
  this.#reportSeries(start, end),
  this.#reportByPaymentMethod(start, end),
  this.#reportByType(start, end),
  this.#topServices(start, end),
])
```

Bentuk yang dikembalikan menambahkan tanggal ISO `from`/`to`, `label` yang
dilokalkan, `totalRevenue`, `paidOrders`, dan:

```ts
averageOrderValue: totals.orders === 0 ? 0 : Math.round(totals.revenue / totals.orders)
```

## Kueri dasar bersama

```ts
#paidQuery(start, end) {
  return db.from('transactions')
    .join('orders', 'orders.id', 'transactions.order_id')
    .where('transactions.status', TransactionStatus.PAID)
    .whereBetween('transactions.created_at', [start.toJSDate(), end.toJSDate()])
}
```

Setiap angka uang dibangun di atas ini. Karena ia menjumlahkan
`orders.total_price` melalui join, **dibutuhkan satu transaksi lunas per
pesanan** — dijamin oleh `transactions_order_id_paid_unique`.

```ts
#reportTotals: .sum('orders.total_price as revenue').countDistinct('orders.id as orders')
```

`countDistinct` melindungi hitungan pesanan; indeks unik parsial melindungi
penjumlahannya.

## Deret

```ts
const days = Math.max(1, Math.ceil(end.diff(start, 'days').days))
return this.#fillDays(start, days, this.#toDayTotals(rows))
```

Dengan `start` di `startOf('day')` dan `end` di `endOf('day')`, satu hari
menghasilkan `diff ≈ 0,9999` → `ceil` → `1`. Dua hari → `1,9999` → `2`. Benar di
kedua ujung.

`#fillDays` mengisi celah dengan nol, sehingga deretnya padat.

## Rincian

`#reportByPaymentMethod` dan `#reportByType` mengelompokkan kueri dasar, lalu
memetakan atas **enum** sehingga setiap nilai muncul terisi nol:

```ts
return Object.values(PaymentMethod).map((method) => ({
  value: method,
  label: PaymentMethodLabel[method],
  orders: Number(totals.get(method)?.orders ?? 0),
  revenue: Math.round(Number(totals.get(method)?.revenue ?? 0)),
}))
```

## Layanan terlaris

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

**`count('order_items.id as orders')` menghitung baris layanan, bukan pesanan.**
Alias `orders` menyesatkan — pesanan dengan tiga layanan menyumbang tiga. Tidak
sebanding dengan `paidOrders`.

Yang satu ini menjumlahkan `order_items.subtotal` alih-alih
`orders.total_price`, jadi ia tidak terpapar kekhawatiran fanout join seperti
angka lainnya.

## Ekspor

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

**Hanya `report.series` yang diekspor.** Rinciannya tetap dihitung (seluruh
`report()` berjalan) tetapi dibuang untuk berkasnya.

## Dukungan indeks

- `transactions` → `['status', 'created_at']` melayani penyaring kueri dasar.
- `order_items` → `catalogue_id` dan komposit `['catalogue_id', 'item_id']`
  melayani join layanan terlaris.

## Kasus tepi

- **Rentang terbalik ditukar diam-diam.**
- **Tidak ada batas atas panjang rentang** — rentang bertahun-tahun
  mengelompokkan semuanya dan `#fillDays` membangun satu entri per hari.
- **`orders` pada `topServices` adalah hitungan baris.**
- **Ekspor menghitung rinciannya lalu membuangnya.**
- **Zona waktu**: pengelompokan memakai `date(transactions.created_at)` dalam
  zona waktu basis data, sementara `#fillDays` membangun hari dari Luxon di
  aplikasi — ketidakcocokan menggeser tepi embernya.
- **Rekonsiliasi manual ikut dihitung** di bawah metode mana pun yang dipilih
  admin.

→ Versi satu menit: [tldr.md](tldr.md)
→ Penjelasan bahasa sehari-hari: [panduan.md](panduan.md)
