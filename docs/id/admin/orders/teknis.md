# Pesanan Admin — Teknis

## Route

| Method | URL                     | Controller           | Nama route           |
| ------ | ----------------------- | -------------------- | -------------------- |
| GET    | `/admin/orders/export`  | `admin.Order.export` | `admin.order.export` |
| GET    | `/admin/orders`         | `admin.Order.index`  | `admin.order.index`  |
| GET    | `/admin/orders/:number` | `admin.Order.show`   | `admin.order.show`   |

`export` didaftarkan **sebelum** `orders/:number`, kalau tidak `/orders/export`
akan terikat sebagai `number = 'export'`.

## Berkas

| Bagian       | Path                                                                                               |
| ------------ | -------------------------------------------------------------------------------------------------- |
| Controller   | [app/controllers/admin/order_controller.ts](../../../../app/controllers/admin/order_controller.ts) |
| Service      | [app/services/order_service.ts](../../../../app/services/order_service.ts)                         |
| Lembar sebar | [app/utils/spreadsheet.ts](../../../../app/utils/spreadsheet.ts)                                   |
| Transformer  | [app/transformers/order_transformer.ts](../../../../app/transformers/order_transformer.ts)         |

## Penyaring

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

Penjaga `|| ''` dan `|| 1` memaksa `null`/`NaN` menjadi nilai bawaan yang aman.

## Kuerinya

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

Cabang pencarian dibungkus callback sendiri supaya grup `OR`-nya tidak bocor
melewati kondisi `status`/`type`.

`status` dan `type` **tidak** divalidasi terhadap enum-nya — nilai tak dikenal
sekadar tidak mencocokkan apa pun.

### Dukungan indeks

`orders` membawa indeks trigram GIN yang dibuat bersama tabelnya:

```sql
CREATE INDEX orders_order_number_trgm_index   ON orders USING GIN (order_number   gin_trgm_ops);
CREATE INDEX orders_customer_name_trgm_index  ON orders USING GIN (customer_name  gin_trgm_ops);
CREATE INDEX orders_customer_phone_trgm_index ON orders USING GIN (customer_phone gin_trgm_ops);
```

Tidak ada indeks btree yang bisa melayani `ILIKE '%term%'`; trigram GIN satu-satunya
tipe yang bisa. Penyaring status dan tipe dilayani `['status', 'created_at']`.

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

Tidak dibatasi per pengguna — admin melihat pesanan mana pun. Dirender dengan
varian transformer `toDetail`.

## Ekspor

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

`toWorkbook` menebalkan baris 1, memberi lebar kolom bawaan 20, dan
mengembalikan `Buffer` dari `workbook.xlsx.writeBuffer()`.

**`listAllForAdmin` tanpa `.paginate()` dan tanpa limit.** Setiap baris yang
cocok dimuat ke memori beserta transaksi yang di-preload. Tidak dibatasi secara
sengaja; aman pada volume sekarang, layak ditinjau bila tabelnya membesar.

Perhatikan penyaring `page` tetap dihitung untuk jalur ekspor tetapi diabaikan.

## Varian transformer

- Baris daftar: `toListItem` — tanggal siap-mesin (`toISO()`, `toISODate()`)
  karena tabelnya memformat sendiri di sisi klien, plus `transactions` lewat
  `whenLoaded`.
- Detail: `toDetail` — tanggal berformat manusia dalam locale Indonesia, plus
  address, items, actions, transactions, user.

## Kasus tepi

- **Urutan route penting** untuk `export` versus `:number`.
- **Nilai `status`/`type` tak dikenal tidak mencocokkan apa pun** alih-alih
  menghasilkan galat.
- **`total_price` bisa `null`**; ekspor melakukan coalesce ke `0`.
- **Ekspornya tidak dibatasi.**
- **Admin tidak bisa memutasi pesanan di sini** — tidak ada route tulis di
  controller ini.

→ Versi satu menit: [tldr.md](tldr.md)
→ Penjelasan bahasa sehari-hari: [panduan.md](panduan.md)
