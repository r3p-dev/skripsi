# Dasbor — Teknis

## Route

| Method | URL      | Controller              | Nama route              |
| ------ | -------- | ----------------------- | ----------------------- |
| GET    | `/admin` | `admin.Dashboard.index` | `admin.dashboard.index` |

## Berkas

| Bagian     | Path                                                                                                       |
| ---------- | ---------------------------------------------------------------------------------------------------------- |
| Controller | [app/controllers/admin/dashboard_controller.ts](../../../../app/controllers/admin/dashboard_controller.ts) |
| Service    | [app/services/analytics_service.ts](../../../../app/services/analytics_service.ts)                         |
| Halaman    | `inertia/pages/admin/index.tsx`                                                                            |

Controller-nya 18 baris — ia memisahkan `recentOrders` untuk dilewatkan ke
`OrderTransformer` dan menyebar sisanya.

## Konstanta

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

`ACTIVE_STATUSES` tidak memuat `COMPLETED` dan `CANCELLED`.

## Perakitan paralel

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

`#summary` sendiri menjalankan enam kueri lagi secara paralel — hitungan,
pendapatan, dan hitungan role berkelompok.

## Pendapatan

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

Menjumlahkan `orders.total_price` melalui join, sehingga **dibutuhkan satu
transaksi lunas per pesanan agar benar**. Invarian itu ditegakkan indeks unik
parsial `transactions_order_id_paid_unique` — lihat
[customer/payment](../../customer/payment/teknis.md).

## Rincian mengisi seluruh domainnya

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

Melakukan iterasi atas **enum** alih-alih hasil kueri menjamin setiap status
muncul, terisi nol. `#typeSplit` melakukan hal yang sama untuk `OrderType`.

## Tren pendapatan

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

`#fillDays` membangun larik berisi tepat `days` entri dari `start`, dengan hari
yang hilang bernilai `0` — sehingga deretnya padat.

Dilayani indeks komposit `['status', 'created_at']` pada `transactions`.

## Beban penjemputan

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

Masing-masing dari 7 entri yang dikembalikan membawa
`{ date, label, booked, capacity }` dengan `capacity: DAILY_PICKUP_LIMIT` (10)
yang diimpor dari `order_service`.

Perhatikan ini hanya mengecualikan `CANCELLED`, jadi ia menghitung pesanan pada
tahap hidup mana pun — himpunan yang lebih luas ketimbang pemeriksaan
`#assertPickupCapacity`, yang hanya menghitung `pickup_scheduled`. **Angka
"dipesan" di dasbor dan batas pemesanan bukan angka yang sama.**

Dilayani `['status', 'pickup_date']`.

## Helper

```ts
#toDayTotals(rows) // Map<tanggal ISO, total dibulatkan>
#fillDays(start, days, totals) // SeriesPoint[] padat dengan label 'd MMM', locale 'id'
#count(query) // Number(row?.total ?? 0)
```

Label memakai `setLocale('id')`.

## Kasus tepi

- **`total_price` nullable**; penjumlahan melakukan coalesce lewat
  `Number(x ?? 0)` lalu membulatkan.
- **`recentOrders` tanpa preload**, jadi relasi `whenLoaded` di transformer
  kembali kosong — varian bawaan `toObject` tidak membutuhkannya.
- **Zona waktu**: `date(transactions.created_at)` mengelompokkan menurut zona
  waktu basis data, sementara `#fillDays` membangun hari dari `DateTime.now()`
  milik Luxon di aplikasi. Ketidakcocokan menggeser batas embernya.
- **"Dipesan" di dasbor ≠ "dipesan" pada batas pemesanan** seperti dijelaskan di
  atas.

→ Versi satu menit: [tldr.md](tldr.md)
→ Penjelasan bahasa sehari-hari: [panduan.md](panduan.md)
