# Rekonsiliasi — Teknis

## Route

| Method | URL                             | Controller                    | Nama route                    |
| ------ | ------------------------------- | ----------------------------- | ----------------------------- |
| GET    | `/admin/reconciliation`         | `admin.Reconciliation.index`  | `admin.reconciliation.index`  |
| POST   | `/admin/reconciliation/:number` | `admin.Reconciliation.update` | `admin.reconciliation.update` |

## Berkas

| Bagian     | Path                                                                                                                 |
| ---------- | -------------------------------------------------------------------------------------------------------------------- |
| Controller | [app/controllers/admin/reconciliation_controller.ts](../../../../app/controllers/admin/reconciliation_controller.ts) |
| Service    | [app/services/transaction_service.ts](../../../../app/services/transaction_service.ts)                               |
| Validator  | `reconciliationValidator` di [admin_validator.ts](../../../../app/validators/admin_validator.ts)                     |

## Daftarnya

```ts
const orders = await this.orderService.listForAdmin({
  ...filters,
  status: OrderStatus.AWAITING_PAYMENT, // ditulis mati
  type: '',
})
```

Ia memakai ulang `listForAdmin`, jadi mewarisi perilaku pencarian yang sama,
dukungan indeks trigram, preload transaksi, dan ukuran halaman 15. **`status`
tetap dan `type` dikosongkan** — hanya `search` dan `page` yang berasal dari
permintaan.

Halamannya juga menerima `paymentMethodOptions` yang dibangun dari enum
`PaymentMethod`.

## Validator

```ts
export const reconciliationValidator = vine.create({
  paymentMethod: vine.enum(Object.values(PaymentMethod)),
  note: vine.string().trim().minLength(5).maxLength(255),
})
```

Minimal 5 karakter inilah yang mencegah catatan berisi `"ok"`.

## Mengonfirmasi

```ts
async update({ params, request, response, session }) {
  const payload = await request.validateUsing(reconciliationValidator)
  const order = await this.orderService.findForAdmin(params.number)

  await this.transactionService.confirmManualPayment(order, payload.paymentMethod, payload.note)

  session.flash('success', `Pesanan ${order.orderNumber} ditandai lunas.`)
  return response.redirect().toRoute('admin.reconciliation.index')
}
```

```ts
async confirmManualPayment(order, paymentMethod, note) {
  this.#assertPayable(order)

  const pending = await this.getPendingTransaction(order)

  const transaction = await db.transaction(async (trx) => {
    if (pending) {
      pending.merge({ status: TransactionStatus.EXPIRED })
      await pending.useTransaction(trx).save()
    }

    const settled = await Transaction.create({
      orderId: order.id,
      paymentMethod,
      status: TransactionStatus.PAID,
      midtransOrderId: null,
      midtransTransactionId: null,
      qrCode: null,
      cashReceived: null,
    }, { client: trx })

    await this.orderService.transitionTo(order, OrderStatus.IN_CLEANING, trx)

    return settled
  })

  logger.info({ order: order.orderNumber, note }, 'Payment confirmed manually')

  this.broadcast(order, transaction)

  return transaction
}
```

Poin yang layak dicatat:

- **`#assertPayable` berjalan lebih dulu**, mendelegasikan ke
  `orderService.canPay` — pesanan harus `awaiting_payment` dengan
  `totalPrice > 0`. Inilah yang mencegah pelanggaran
  `transactions_order_id_paid_unique`.
- **Mengedaluwarsakan baris tertunda dan membuat baris lunas adalah satu
  transaksi**, sehingga kode QRIS basi tidak bisa dibayar sesudahnya.
- **Field Midtrans bernilai `null`**, dan itulah yang membedakan pelunasan manual
  dari pelunasan lewat gerbang.
- **`cashReceived` bernilai `null`** bahkan untuk `cash` — berbeda dari pesanan
  konter, tidak ada kembalian yang dihitung di sini.
- `transitionTo` menegakkan `awaiting_payment → in_cleaning`.

## Catatannya tidak disimpan

```ts
logger.info({ order: order.orderNumber, note }, 'Payment confirmed manually')
```

`transactions` tidak punya kolom `note`
([migrasi](../../../../database/migrations/1781150476881_create_transactions_table.ts)).
Alasannya hanya bertahan di log aplikasi — tidak bisa dikueri, tidak ditampilkan
di halaman detail pesanan. Menyimpannya butuh perubahan skema.

## Efek pada pelaporan

Pelunasan manual adalah transaksi `paid` seperti yang lain, jadi ia dihitung
dalam:

- pendapatan dasbor (`#paidRevenue`)
- tren pendapatan dan deret laporan
- `#reportByPaymentMethod`, di bawah metode mana pun yang dipilih admin

Karena itu memilih metode secara akurat penting untuk rincian komposisi
pembayaran di [reports](../reports/).

## Kasus tepi

- **Pelunasan ganda diblokir** oleh `#assertPayable`, didukung indeks unik
  parsial.
- **Rekonsiliasi tunai tidak mencatat `cashReceived`**, jadi `changeFor`
  mengembalikan `0`.
- **Daftarnya sama sekali mengabaikan penyaring `type`.**
- **`findForAdmin` di-preload penuh** — lebih berat dari yang dibutuhkan aksi
  ini, tetapi ia memasok nomor pesanan untuk pesan flash.
- **Siaran terjadi setelah commit**, jadi pelanggan hanya melihat keadaan yang
  sudah lunas.

→ Versi satu menit: [tldr.md](tldr.md)
→ Penjelasan bahasa sehari-hari: [panduan.md](panduan.md)
