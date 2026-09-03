# Dasbor — TL;DR

Satu ikhtisar hanya-baca atas seluruh operasi, disusun dari **enam kueri
paralel**.

![Dasbor — ringkasan, tren, beban penjemputan, pesanan terbaru](../../../assets/admin-dashboard-index-desktop.png)

## Lima hal yang perlu diketahui

1. **Hanya baca.** Tanpa aksi, tanpa form — murni tampilan.
2. **Enam kueri berjalan paralel** lewat `Promise.all`, jadi halamannya memakan
   kira-kira latensi satu perjalanan, bukan enam.
3. **Pendapatan hanya menghitung uang yang sudah lunas** — transaksi berstatus
   `paid`, di-join kembali ke pesanan yang dibayarnya.
4. **Tren pendapatan mencakup 14 hari**, beban penjemputan melihat **7 hari ke
   depan**, dan menampilkan **8 pesanan terbaru**.
5. **Hari yang kosong diisi nol**, sehingga grafik tidak pernah berlubang.

## Yang ditampilkan

| Blok              | Isi                                                                                  |
| ----------------- | ------------------------------------------------------------------------------------ |
| Ringkasan         | Total / aktif / selesai / menunggu-pelunasan, pendapatan, jumlah pelanggan + petugas |
| Rincian status    | Setiap `OrderStatus` beserta jumlahnya                                               |
| Pembagian tipe    | Setiap `OrderType` beserta jumlahnya                                                 |
| Tren pendapatan   | Pendapatan lunas harian, 14 hari terakhir                                            |
| Beban penjemputan | Pemesanan vs kapasitas, 7 hari ke depan                                              |
| Pesanan terbaru   | 8 terakhir                                                                           |

## Route

`GET /admin` → `admin.dashboard.index`

## Jebakannya

**"Aktif" adalah daftar spesifik berisi tujuh status**, bukan "apa pun yang belum
selesai". `ACTIVE_STATUSES` tidak memuat `completed` dan `cancelled` — jadi
angkanya tidak akan berjumlah sama dengan total pesanan kecuali Anda
memperhitungkan keduanya.

→ Penjelasan bahasa sehari-hari: [panduan.md](panduan.md)
→ Detail implementasi: [teknis.md](teknis.md)
