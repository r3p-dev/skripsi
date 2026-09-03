# Rekonsiliasi — TL;DR

Menandai pesanan lunas untuk uang yang tiba **di luar** aplikasi — transfer bank
yang webhook-nya tidak pernah datang, atau tunai yang diterima di toko.

![Pesanan yang menunggu pelunasan (status dipaku)](../../../assets/admin-reconciliation-index-desktop.png)

## Lima hal yang perlu diketahui

1. **Ini daftar pesanan tersaring, dipaku ke `awaiting_payment`.** Penyaring
   statusnya ditulis mati; hanya pencarian dan halaman yang dikendalikan
   pengguna.
2. **Catatan tertulis wajib**, 5 sampai 255 karakter. Itulah jejak auditnya.
3. **Konfirmasi membuat transaksi `paid` tanpa field Midtrans** dan memindahkan
   pesanan ke `in_cleaning` — hasil yang sama dengan pembayaran QRIS.
4. **Transaksi tertunda apa pun diedaluwarsakan** dalam transaksi basis data yang
   sama.
5. **Dijaga oleh `canPay`**, sehingga tidak bisa melunasi pesanan dua kali.

## Route sekilas

| Method | URL                             | Fungsi                          |
| ------ | ------------------------------- | ------------------------------- |
| GET    | `/admin/reconciliation`         | Pesanan yang menunggu pelunasan |
| POST   | `/admin/reconciliation/:number` | Menandai satu pesanan lunas     |

## Validator

```ts
reconciliationValidator = {
  paymentMethod: vine.enum(PaymentMethod), // cash | qris | debit
  note: vine.string().trim().minLength(5).maxLength(255),
}
```

## Jebakannya

**Catatannya hanya ditulis ke log, bukan ke baris transaksi.**

```ts
logger.info({ order: order.orderNumber, note }, 'Payment confirmed manually')
```

`transactions` tidak punya kolom catatan. Jika Anda perlu menelusuri _kenapa_
sebuah pesanan dilunasi manual, jawabannya ada di log aplikasi — tidak bisa
dikueri dari basis data.

→ Penjelasan bahasa sehari-hari: [panduan.md](panduan.md)
→ Detail implementasi: [teknis.md](teknis.md)
