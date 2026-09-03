# Laporan — TL;DR

Pendapatan pada rentang tanggal pilihan, dirinci per hari, metode pembayaran,
tipe pesanan, dan layanan terlaris. Bisa diekspor ke XLSX.

![Laporan pada rentang bawaan 30 hari](../../../assets/admin-reports-index-desktop.png)

## Lima hal yang perlu diketahui

1. **Rentang bawaannya 30 hari terakhir**, berakhir hari ini.
2. **Rentang terbalik dibetulkan diam-diam** — `from > to` ditukar, bukan
   digagalkan.
3. **Pendapatan hanya menghitung transaksi lunas**, di-join kembali ke
   pesanannya.
4. **Nilai pesanan rata-rata dibulatkan ke bilangan bulat**, dan bernilai `0`
   bila tidak ada pesanan lunas.
5. **Ekspor hanya memuat deret harian** — tanggal dan pendapatan — bukan
   rincian yang tampil di layar.

## Route sekilas

| Method | URL                     | Fungsi                        |
| ------ | ----------------------- | ----------------------------- |
| GET    | `/admin/reports`        | Laporan, disaring per rentang |
| GET    | `/admin/reports/export` | XLSX deret harian             |

## Yang dihitung

| Blok                | Makna                                             |
| ------------------- | ------------------------------------------------- |
| `totalRevenue`      | Jumlah `orders.total_price` untuk transaksi lunas |
| `paidOrders`        | `countDistinct` pesanan                           |
| `averageOrderValue` | pendapatan ÷ pesanan, dibulatkan                  |
| `series`            | Pendapatan harian, terisi nol                     |
| `byPaymentMethod`   | Setiap `PaymentMethod`, terisi nol                |
| `byType`            | Setiap `OrderType`, terisi nol                    |
| `topServices`       | 10 katalog teratas menurut pendapatan             |

## Jebakannya

**`topServices` menghitung baris `order_items`, tetapi diberi label `orders`.**
Pesanan dengan tiga layanan menyumbang tiga ke hitungan itu. Itu hitungan baris,
bukan hitungan pesanan — jangan membandingkannya dengan `paidOrders`.

→ Penjelasan bahasa sehari-hari: [panduan.md](panduan.md)
→ Detail implementasi: [teknis.md](teknis.md)
