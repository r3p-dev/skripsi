# Pesanan Admin — TL;DR

Seluruh pesanan di toko, bisa disaring dan diekspor. **Hanya baca** — admin tidak
bisa memajukan status pesanan dari sini.

![Semua pesanan, terbaru dulu](../../../assets/admin-orders-index-desktop.png)

## Lima hal yang perlu diketahui

1. **Hanya baca.** Daftar, detail, ekspor. Perubahan status milik petugas;
   konfirmasi pembayaran ada di [reconciliation](../reconciliation/).
2. **Tiga penyaring, semuanya opsional**: pencarian teks bebas, status, tipe.
   Ditambah penomoran halaman.
3. **Pencarian mencocokkan nomor pesanan, nama pelanggan, atau telepon**, dengan
   wildcard di awal.
4. **Daftar dipaginasi 15**; ekspor mengabaikan paginasi dan mengembalikan semua
   baris yang cocok.
5. **Pesanan dialamatkan lewat nomor pesanan**, bukan id.

## Route sekilas

| Method | URL                     | Fungsi                           |
| ------ | ----------------------- | -------------------------------- |
| GET    | `/admin/orders`         | Daftar tersaring dan terpaginasi |
| GET    | `/admin/orders/:number` | Detail lengkap                   |
| GET    | `/admin/orders/export`  | XLSX semua baris yang cocok      |

## Kolom ekspor

Nomor · Pelanggan · Telepon · Status · Tipe · Total · Jadwal Jemput · Dibuat

## Jebakannya

**Ekspor tidak dibatasi.** `listAllForAdmin` menjalankan kueri yang sama tanpa
`.paginate()`, memuat setiap kecocokan ke memori, lalu membangun workbook. Dengan
penyaring yang sempit itu baik-baik saja; tanpa penyaring sama sekali, ia tumbuh
mengikuti ukuran tabel.

Jebakan kedua: **`ILIKE '%term%'` tidak bisa memakai indeks btree**, itulah
sebabnya `orders` membawa tiga indeks trigram GIN pada `order_number`,
`customer_name`, dan `customer_phone`.

→ Penjelasan bahasa sehari-hari: [panduan.md](panduan.md)
→ Detail implementasi: [teknis.md](teknis.md)
