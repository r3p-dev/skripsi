# Pembayaran — TL;DR

Pelanggan membayar lewat **QRIS melalui Midtrans**, dan hanya setelah pesanan
diinspeksi dan dihargai.

![`pending` — kode QRIS menunggu dipindai](../../../assets/customer-payment-pending-desktop.png)

## Lima hal yang perlu diketahui

1. **Pembayaran hanya bisa saat `awaiting_payment`, dan hanya bila
   `totalPrice > 0`.** Itulah `canPay()`, diperiksa di sisi server setiap kali.
2. **Kode QR kedaluwarsa setelah 15 menit.** Meminta bayar lagi akan memakai
   ulang transaksi tertunda yang masih segar, atau mengedaluwarsakan yang basi
   lalu menagih ulang.
3. **Pembayaran dikonfirmasi lewat webhook, bukan lewat peramban.** Midtrans
   memanggil `POST /transaction/callback`; halaman pelanggan diperbarui via SSE.
4. **Membayar memindahkan pesanan ke `in_cleaning` otomatis.** Itulah `#settle`.
5. **Satu transaksi lunas per pesanan**, ditegakkan indeks unik parsial
   `transactions_order_id_paid_unique`.

## Route sekilas

| Method | URL                       | Fungsi                                            |
| ------ | ------------------------- | ------------------------------------------------- |
| GET    | `/orders/:number/payment` | Menampilkan QR / status pembayaran                |
| POST   | `/orders/:number/payment` | Memulai atau menyegarkan pembayaran               |
| POST   | `/transaction/callback`   | Webhook Midtrans (tanpa auth, dicek tanda tangan) |

## Status

`pending` · `paid` · `expired` · `cancelled` · `failed`

## Jebakannya

**Webhook adalah sumber kebenaran, bukan pengalihan peramban.** Pelanggan bisa
memindai, membayar, dan sejenak masih melihat layar "tertunda" sampai Midtrans
memanggil balik. Jangan pernah menyimpulkan keberhasilan dari kembalinya
peramban.

Jebakan kedua: **`capture` Midtrans dengan `fraud_status: 'challenge'` diturunkan
menjadi `pending`**, bukan dianggap lunas. Di dasbor Midtrans terlihat seperti
pembayaran sukses, tetapi sengaja tidak melunasi pesanan.

→ Penjelasan bahasa sehari-hari: [panduan.md](panduan.md)
→ Detail implementasi: [teknis.md](teknis.md)
