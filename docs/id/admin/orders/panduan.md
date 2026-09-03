# Pesanan Admin — Panduan

Jendela admin ke seluruh pesanan di toko, tidak peduli siapa yang memesannya
atau berada di tahap apa.

## Apa yang bisa dan tidak bisa dilakukan admin

**Bisa**: melihat pesanan mana pun, menyaring dan mencari seluruh daftar,
membuka detail lengkap, dan mengekspor ke lembar sebar.

**Tidak bisa**: memajukan sebuah pesanan. Admin tidak bisa menandai sesuatu
sudah diambil, dicuci, atau diantar. Aksi itu milik petugas, yang secara fisik
menangani barangnya.

Satu pengecualian terkait uang adalah mengonfirmasi pembayaran yang tiba di luar
aplikasi — itulah [reconciliation](../reconciliation/), yang punya layar sendiri.

Pemisahan ini disengaja. Tampilan admin untuk pengawasan, bukan untuk
menjalankan alur kerja.

## Menemukan pesanan

Tiga penyaring, semuanya opsional dan bisa digabung:

**Pencarian** mencocokkan nomor pesanan, nama pelanggan, atau nomor teleponnya.
Kecocokan sebagian berfungsi — mengetik sebagian nomor telepon akan menemukannya.

**Status** mempersempit ke satu tahap: menunggu pelunasan, dalam pencucian, dan
seterusnya.

**Tipe** mempersempit ke pesanan online, offline, atau langsung-dengan-antar.

Hasilnya terbaru dulu, 15 per halaman.

## Detail pesanan

Membuka sebuah pesanan menampilkan segala yang diketahui sistem: pelanggannya,
alamat pengantaran, setiap barang beserta layanan yang dikenakan padanya, riwayat
aksi lengkap (siapa melakukan apa, kapan, beserta foto), dan setiap percobaan
pembayaran.

Riwayat aksi adalah jejak auditnya. Ia menampilkan foto penjemputan, foto
inspeksi, foto pencucian, dan siapa yang bertanggung jawab untuk tiap langkah.

## Mengekspor

Ekspor menghasilkan lembar sebar berisi pesanan beserta nomor, nama dan telepon
pelanggan, status, tipe, total, tanggal jemput, dan waktu pembuatan.

**Penyaring apa pun yang sedang diterapkan ikut terbawa ke ekspor.** Menyaring ke
"menunggu pelunasan" lalu mengekspor menghasilkan hanya pesanan tersebut.

Satu hal yang perlu diketahui: **ekspornya tidak dipaginasi.** Ia mengembalikan
setiap baris yang cocok dengan penyaring, bukan hanya halaman yang sedang
dilihat. Mengekspor tanpa penyaring berarti mengekspor seluruh tabel pesanan.
Itu biasanya memang yang diinginkan orang, tetapi layak disadari pada kumpulan
data besar.

## Kenapa pencarian bisa lambat pada skala besar

Mencari berdasarkan teks sebagian secara alamiah lebih berat bagi basis data
ketimbang mencocokkan nilai persis. Aplikasi ini menambahkan indeks khusus tepat
untuk keperluan itu, sehingga pencarian sebagian atas nomor pesanan, nama, dan
telepon tetap cepat seiring bertambahnya tabel.

## Tangkapan Layar

Setiap keadaan di bawah ditampilkan pada tiga lebar — desktop (1440px), tablet (834px), dan mobile (430px). Gambar utama di atas memakai tampilan desktop, sesuai cara layar role ini biasa dipakai.

**Semua pesanan, terbaru dulu**

| Desktop                                                                                  | Tablet                                                                                 | Mobile                                                                                 |
| ---------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| ![Semua pesanan, terbaru dulu — desktop](../../../assets/admin-orders-index-desktop.png) | ![Semua pesanan, terbaru dulu — tablet](../../../assets/admin-orders-index-tablet.png) | ![Semua pesanan, terbaru dulu — mobile](../../../assets/admin-orders-index-mobile.png) |

**Disaring menurut status**

| Desktop                                                                                 | Tablet                                                                                | Mobile                                                                                |
| --------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| ![Disaring menurut status — desktop](../../../assets/admin-orders-filtered-desktop.png) | ![Disaring menurut status — tablet](../../../assets/admin-orders-filtered-tablet.png) | ![Disaring menurut status — mobile](../../../assets/admin-orders-filtered-mobile.png) |

**Pencarian sebagian pada nomor pesanan**

| Desktop                                                                                             | Tablet                                                                                            | Mobile                                                                                            |
| --------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| ![Pencarian sebagian pada nomor pesanan — desktop](../../../assets/admin-orders-search-desktop.png) | ![Pencarian sebagian pada nomor pesanan — tablet](../../../assets/admin-orders-search-tablet.png) | ![Pencarian sebagian pada nomor pesanan — mobile](../../../assets/admin-orders-search-mobile.png) |

**Pencarian yang tidak menemukan apa pun**

| Desktop                                                                                             | Tablet                                                                                            | Mobile                                                                                            |
| --------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| ![Pencarian yang tidak menemukan apa pun — desktop](../../../assets/admin-orders-empty-desktop.png) | ![Pencarian yang tidak menemukan apa pun — tablet](../../../assets/admin-orders-empty-tablet.png) | ![Pencarian yang tidak menemukan apa pun — mobile](../../../assets/admin-orders-empty-mobile.png) |

**Detail pesanan dengan barang, aksi, dan transaksi**

| Desktop                                                                                                       | Tablet                                                                                                      | Mobile                                                                                                      |
| ------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| ![Detail pesanan dengan barang, aksi, dan transaksi — desktop](../../../assets/admin-orders-show-desktop.png) | ![Detail pesanan dengan barang, aksi, dan transaksi — tablet](../../../assets/admin-orders-show-tablet.png) | ![Detail pesanan dengan barang, aksi, dan transaksi — mobile](../../../assets/admin-orders-show-mobile.png) |

→ Versi satu menit: [tldr.md](tldr.md)
→ Detail implementasi: [teknis.md](teknis.md)
