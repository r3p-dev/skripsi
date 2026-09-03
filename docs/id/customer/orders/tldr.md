# Pesanan — TL;DR

Pelanggan memesan penjemputan, mendaftar barang yang dikirim, lalu memantaunya.
**Harga belum diketahui saat pemesanan** — harga ditetapkan kemudian oleh petugas
setelah inspeksi fisik.

![Riwayat pesanan](../../../assets/customer-orders-index-desktop.png)

## Lima hal yang perlu diketahui

1. **Anda butuh alamat tersimpan sebelum bisa memesan.** Tanpa alamat, tidak ada
   pesanan — gagal pada field `form`.
2. **Tanggal jemput harus di masa depan**, dan setiap tanggal punya batas keras
   **10 penjemputan terjadwal** (`DAILY_PICKUP_LIMIT`).
3. **Antara 1 sampai 10 barang per pesanan** (`MAX_ITEMS_PER_ORDER`).
4. **`totalPrice` diawali `null`.** Diisi saat inspeksi. Harga `null` bukan bug,
   artinya "belum diinspeksi".
5. **Pembatalan hanya bisa sebelum tanggal jemput**, dan hanya selama status
   masih `pickup_scheduled`.

## Route sekilas

| Method | URL                       | Fungsi                      |
| ------ | ------------------------- | --------------------------- |
| GET    | `/orders`                 | Mendaftar pesanan pelanggan |
| GET    | `/orders/create`          | Form pemesanan              |
| POST   | `/orders`                 | Membuat pesanan             |
| GET    | `/orders/:number`         | Memantau satu pesanan       |
| PUT    | `/orders/:number`         | Membatalkannya              |
| GET    | `/orders/:number/receipt` | Struk siap cetak            |

Pesanan dialamatkan lewat **nomor pesanan** (mis. `ORD2608-0496`), bukan id
basis data.

## Jebakannya

**Pembatalan adalah `PUT` ke pesanan, bukan `DELETE`.** Route resource
mengecualikan `edit` dan `destroy`, jadi `update` dialihfungsikan sebagai
"batalkan". Tidak ada yang benar-benar dihapus — pesanan pindah ke `cancelled`
dan tetap ada di riwayat.

Jebakan kedua: **batas jemput harian hanya menghitung pesanan yang masih
`pickup_scheduled`.** Begitu penjemputan selesai, slotnya bebas kembali, jadi
batasnya adalah "10 yang menunggu", bukan "10 yang pernah dipesan".

→ Penjelasan bahasa sehari-hari: [panduan.md](panduan.md)
→ Detail implementasi: [teknis.md](teknis.md)
