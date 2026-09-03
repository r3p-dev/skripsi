# Pembayaran — Teknis

## Route

| Method | URL                       | Controller                    | Auth          | Limiter          |
| ------ | ------------------------- | ----------------------------- | ------------- | ---------------- |
| GET    | `/orders/:number/payment` | `customer.Transaction.show`   | customer      | —                |
| POST   | `/orders/:number/payment` | `customer.Transaction.store`  | customer      | `paymentLimiter` |
| POST   | `/transaction/callback`   | `webhooks.Transaction.update` | **tidak ada** | —                |

`paymentLimiter`: 15 permintaan / 5 menit, blokir 5 menit, dikunci pada id
pengguna.

Webhook berada di luar semua grup auth — ia diautentikasi lewat **verifikasi
tanda tangan**, bukan sesi.

## Berkas

| Bagian               | Path                                                                                                                 |
| -------------------- | -------------------------------------------------------------------------------------------------------------------- |
| Service              | [app/services/transaction_service.ts](../../../../app/services/transaction_service.ts)                               |
| Controller pelanggan | [app/controllers/customer/transaction_controller.ts](../../../../app/controllers/customer/transaction_controller.ts) |
| Webhook              | [app/controllers/webhooks/transaction_controller.ts](../../../../app/controllers/webhooks/transaction_controller.ts) |
| Konfigurasi Midtrans | `#config/midtrans`                                                                                                   |
| Enum                 | [app/enums/transaction_enum.ts](../../../../app/enums/transaction_enum.ts)                                           |

## Model data

`transactions` ([migrasi](../../../../database/migrations/1781150476881_create_transactions_table.ts)):

| Kolom                     | Catatan                                     |
| ------------------------- | ------------------------------------------- |
| `order_id`                | FK → orders, `ON DELETE CASCADE`, terindeks |
| `payment_method`          | `cash` \| `qris` \| `debit`                 |
| `midtrans_order_id`       | terindeks; `{orderNumber}-{n}`              |
| `midtrans_transaction_id` | terindeks                                   |
| `qr_code`                 | text, URL gambar QR                         |
| `status`                  | terindeks                                   |
| `cash_received`           | decimal, hanya pembayaran konter            |

Dua indeks unik parsial:

```sql
CREATE UNIQUE INDEX transactions_order_id_pending_unique
  ON transactions (order_id) WHERE status = 'pending';

CREATE UNIQUE INDEX transactions_order_id_paid_unique
  ON transactions (order_id) WHERE status = 'paid';
```

Yang `paid` penting untuk pelaporan: pendapatan menjumlahkan `orders.total_price`
melalui join ke `transactions`, jadi baris lunas kedua akan menghitung ganda
pesanan itu. `countDistinct` melindungi _jumlah pesanan_ tetapi bukan
_penjumlahannya_, sehingga invarian ini hidup di skema.

## Memulai pembayaran

```ts
async startPayment(order) {
  this.#assertPayable(order)
  const pending = await this.getPendingTransaction(order)
  if (pending && !this.#isStale(pending)) return pending
  const charge = await this.#charge(order)
  return db.transaction(async (trx) => {
    if (pending) await pending.merge({ status: EXPIRED }).useTransaction(trx).save()
    return Transaction.create({ ...charge, status: PENDING, paymentMethod: QRIS }, { client: trx })
  })
}
```

`#assertPayable` mendelegasikan ke `orderService.canPay` dan menghasilkan pesan
berbeda tergantung apakah pesanan berada di `awaiting_payment` tanpa harga, atau
memang belum sampai tahap itu.

```ts
#isStale(t) {
  if (!t.qrCode) return true
  return t.createdAt.diffNow('minutes').minutes < -QR_LIFETIME_MINUTES  // 15
}
```

Transaksi tertunda tanpa `qrCode` selalu dianggap basi — itu menutup kasus
penagihan yang setengah berhasil.

`#nextMidtransOrderId` menghitung transaksi yang ada dan menambahkan `n + 1`,
memberi Midtrans id unik tiap percobaan sekaligus menjaga nomor pesanan tetap
terbaca.

`#charge` membungkus `core.charge(...)` dengan `payment_type: 'qris'`. Galat apa
pun dicatat dan diubah menjadi `E_VALIDATION_ERROR` pada `form` — kegagalan hulu
tidak pernah muncul sebagai 500.

## Penanganan webhook

```ts
async update({ request, response }) {
  const payload = request.body()
  if (!verifyNotificationSignature(payload)) return response.forbidden(...)
  await this.transactionService.handleNotification(payload)
  return response.ok({ message: 'OK' })
}
```

`handleNotification`:

1. Cari transaksi lewat `midtrans_order_id`, mem-preload `order`. Id tidak
   dikenal → catat peringatan dan kembalikan `200`.
2. `#resolveStatus(payload)`.
3. Kembali lebih awal bila status tidak berubah, atau bila transaksi sudah
   `paid` — **lunas bersifat final**, panggilan balik berikutnya tidak bisa
   membatalkannya.
4. Gabungkan status dan `midtransTransactionId`, simpan.
5. Jika kini `paid`, panggil `#settle(order)`.
6. `broadcast(order, transaction)`.

### Pemetaan status

```ts
NOTIFICATION_STATUSES = {
  capture: PAID,
  settlement: PAID,
  pending: PENDING,
  deny: FAILED,
  cancel: CANCELLED,
  expire: EXPIRED,
  failure: FAILED,
}
```

Nilai tidak dikenal jatuh ke `FAILED`. Lalu:

```ts
if (status === PAID && payload.fraud_status === 'challenge') return PENDING
```

Penangkapan yang ditantang ditahan, bukan dilunasi.

### Pelunasan

```ts
async #settle(order) {
  if (order.status !== OrderStatus.AWAITING_PAYMENT) return
  await this.orderService.transitionTo(order, OrderStatus.IN_CLEANING)
}
```

Dijaga supaya panggilan balik yang diputar ulang pada pesanan yang sudah maju
menjadi tanpa efek.

## Konfirmasi manual

`confirmManualPayment(order, paymentMethod, note)` — dipakai oleh
[admin/reconciliation](../../admin/reconciliation/):

1. `#assertPayable(order)`.
2. Dalam satu transaksi: edaluwarsakan baris tertunda, buat transaksi `paid`
   tanpa field Midtrans, `transitionTo(IN_CLEANING)`.
3. Catat di level info beserta catatannya, lalu siarkan.

Karena `#assertPayable` berjalan lebih dulu, konfirmasi manual kedua pada pesanan
yang sudah lunas ditolak sebelum sempat melanggar indeks unik paid.

## Realtime

```ts
transmit.broadcast(`orders/${order.orderNumber}`, {
  transactionStatus: transaction.status,
  orderStatus: order.status,
})
```

Otorisasi kanal ada di [start/routes.ts](../../../../start/routes.ts).

## Kasus tepi

- **Webhook adalah satu-satunya jalur pelunasan untuk QRIS.** Tanpa polling,
  tanpa konfirmasi dari sisi peramban.
- **`paid` bersifat final** di `handleNotification`.
- **`getLatestTransaction`** mengurutkan yang tertunda lebih dulu
  (`case when status = 'pending' then 0 else 1 end`), lalu terbaru — sehingga
  halaman menampilkan percobaan yang masih terbuka ketimbang yang lama sudah
  lunas.
- **`ON DELETE CASCADE`** berarti menghapus pesanan ikut membawa transaksinya.
- Halaman pembayaran mengalihkan kembali ke pesanan dengan flash bila belum ada
  transaksi.

→ Versi satu menit: [tldr.md](tldr.md)
→ Penjelasan bahasa sehari-hari: [panduan.md](panduan.md)
