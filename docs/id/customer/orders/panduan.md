# Pesanan — Panduan

Ini sisi pelanggan dari sebuah pesanan: memesannya, memantau perkembangannya,
dan mendapat struk di akhir.

## Sebelum bisa memesan

Pelanggan butuh [alamat](../address/) tersimpan. Pesanan mengambil lokasi
penjemputan, nama penerima, dan telepon kontak **dari alamat**, bukan dari form
pesanan — jadi tanpa alamat tidak ada tempat untuk menjemput.

Mencoba memesan tanpa alamat memunculkan pesan yang meminta mereka menambahkan
alamat lebih dulu.

## Memesan penjemputan

Formnya menanyakan dua hal: **kapan** dan **apa**.

**Kapan** — tanggal penjemputan, yang harus di masa depan. Pemesanan untuk hari
yang sama tidak diizinkan.

Setiap tanggal punya kapasitas **10 penjemputan**. Jika sepuluh pelanggan sudah
memesan hari itu, tanggalnya ditolak dan mereka diminta memilih yang lain.
Pesannya muncul pada field tanggal jemput.

Yang layak dipahami: batas itu menghitung pesanan yang _masih menunggu
dijemput_. Begitu kurir benar-benar menjemput sebuah pesanan, statusnya berpindah
dan slotnya bebas. Jadi batasnya sebenarnya "sepuluh penjemputan tertunggak pada
tanggal itu", yang dalam praktik cocok dengan berapa rit yang sanggup dikerjakan
tim.

**Apa** — daftar barang, antara satu sampai sepuluh. Untuk tiap barang pelanggan
menjelaskan:

- Jenis: sepatu, tas, atau helm
- Merek, model, ukuran, bahan
- Catatan opsional

Perhatikan apa yang _tidak_ ditanyakan: layanannya. Pelanggan tidak memilih
"cuci mendalam" atau "reparasi" — mereka menjelaskan bendanya, dan petugas yang
memutuskan perlakuan apa yang dibutuhkan saat memeriksa fisiknya.

## Kenapa harganya belum ada

Ini hal terpenting yang perlu dipahami tentang aplikasi ini.

Saat dipesan, pesanan **sama sekali belum punya harga**. `totalPrice` kosong. Itu
bukan fitur yang hilang — Anda tidak bisa menghargai cuci sepatu tanpa melihat
sepatunya.

Harga muncul setelah penjemputan, ketika petugas memeriksa barang dan
mencocokkan tiap barang dengan layanan katalog. Barulah pesanan punya tagihan,
dan barulah pelanggan bisa membayar.

Jadi pengalaman pelanggan adalah: pesan → tunggu → dijemput → **menerima harga**

## Tangkapan Layar

Setiap keadaan di bawah ditampilkan pada tiga lebar — desktop (1440px), tablet (834px), dan mobile (430px). Gambar utama di atas memakai tampilan desktop, sesuai cara layar role ini biasa dipakai.

**Riwayat pesanan**

| Desktop                                                                         | Tablet                                                                        | Mobile                                                                        |
| ------------------------------------------------------------------------------- | ----------------------------------------------------------------------------- | ----------------------------------------------------------------------------- |
| ![Riwayat pesanan — desktop](../../../assets/customer-orders-index-desktop.png) | ![Riwayat pesanan — tablet](../../../assets/customer-orders-index-tablet.png) | ![Riwayat pesanan — mobile](../../../assets/customer-orders-index-mobile.png) |

**Belum ada pesanan**

| Desktop                                                                           | Tablet                                                                          | Mobile                                                                          |
| --------------------------------------------------------------------------------- | ------------------------------------------------------------------------------- | ------------------------------------------------------------------------------- |
| ![Belum ada pesanan — desktop](../../../assets/customer-orders-empty-desktop.png) | ![Belum ada pesanan — tablet](../../../assets/customer-orders-empty-tablet.png) | ![Belum ada pesanan — mobile](../../../assets/customer-orders-empty-mobile.png) |

**Form pemesanan — tanggal jemput dan barang**

| Desktop                                                                                                     | Tablet                                                                                                    | Mobile                                                                                                    |
| ----------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| ![Form pemesanan — tanggal jemput dan barang — desktop](../../../assets/customer-orders-create-desktop.png) | ![Form pemesanan — tanggal jemput dan barang — tablet](../../../assets/customer-orders-create-tablet.png) | ![Form pemesanan — tanggal jemput dan barang — mobile](../../../assets/customer-orders-create-mobile.png) |

**`pickup_scheduled` — sudah dipesan, masih bisa dibatalkan**

| Desktop                                                                                                                              | Tablet                                                                                                                             | Mobile                                                                                                                             |
| ------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| ![`pickup_scheduled` — sudah dipesan, masih bisa dibatalkan — desktop](../../../assets/customer-orders-pickup-scheduled-desktop.png) | ![`pickup_scheduled` — sudah dipesan, masih bisa dibatalkan — tablet](../../../assets/customer-orders-pickup-scheduled-tablet.png) | ![`pickup_scheduled` — sudah dipesan, masih bisa dibatalkan — mobile](../../../assets/customer-orders-pickup-scheduled-mobile.png) |

**`in_pickup` — sudah dijemput, menuju toko**

| Desktop                                                                                                       | Tablet                                                                                                      | Mobile                                                                                                      |
| ------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| ![`in_pickup` — sudah dijemput, menuju toko — desktop](../../../assets/customer-orders-in-pickup-desktop.png) | ![`in_pickup` — sudah dijemput, menuju toko — tablet](../../../assets/customer-orders-in-pickup-tablet.png) | ![`in_pickup` — sudah dijemput, menuju toko — mobile](../../../assets/customer-orders-in-pickup-mobile.png) |

**`awaiting_payment` — sudah dihargai, menunggu dibayar**

| Desktop                                                                                                                          | Tablet                                                                                                                         | Mobile                                                                                                                         |
| -------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------ |
| ![`awaiting_payment` — sudah dihargai, menunggu dibayar — desktop](../../../assets/customer-orders-awaiting-payment-desktop.png) | ![`awaiting_payment` — sudah dihargai, menunggu dibayar — tablet](../../../assets/customer-orders-awaiting-payment-tablet.png) | ![`awaiting_payment` — sudah dihargai, menunggu dibayar — mobile](../../../assets/customer-orders-awaiting-payment-mobile.png) |

**`in_cleaning` — sudah lunas, sedang dikerjakan**

| Desktop                                                                                                              | Tablet                                                                                                             | Mobile                                                                                                             |
| -------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------ |
| ![`in_cleaning` — sudah lunas, sedang dikerjakan — desktop](../../../assets/customer-orders-in-cleaning-desktop.png) | ![`in_cleaning` — sudah lunas, sedang dikerjakan — tablet](../../../assets/customer-orders-in-cleaning-tablet.png) | ![`in_cleaning` — sudah lunas, sedang dikerjakan — mobile](../../../assets/customer-orders-in-cleaning-mobile.png) |

**`cleaning_done` — siap diambil di toko**

| Desktop                                                                                                        | Tablet                                                                                                       | Mobile                                                                                                       |
| -------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------ |
| ![`cleaning_done` — siap diambil di toko — desktop](../../../assets/customer-orders-cleaning-done-desktop.png) | ![`cleaning_done` — siap diambil di toko — tablet](../../../assets/customer-orders-cleaning-done-tablet.png) | ![`cleaning_done` — siap diambil di toko — mobile](../../../assets/customer-orders-cleaning-done-mobile.png) |

**`in_delivery` — dalam perjalanan kembali**

| Desktop                                                                                                        | Tablet                                                                                                       | Mobile                                                                                                       |
| -------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------ |
| ![`in_delivery` — dalam perjalanan kembali — desktop](../../../assets/customer-orders-in-delivery-desktop.png) | ![`in_delivery` — dalam perjalanan kembali — tablet](../../../assets/customer-orders-in-delivery-tablet.png) | ![`in_delivery` — dalam perjalanan kembali — mobile](../../../assets/customer-orders-in-delivery-mobile.png) |

**`completed` — beserta riwayat aksi lengkap**

| Desktop                                                                                                        | Tablet                                                                                                       | Mobile                                                                                                       |
| -------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------ |
| ![`completed` — beserta riwayat aksi lengkap — desktop](../../../assets/customer-orders-completed-desktop.png) | ![`completed` — beserta riwayat aksi lengkap — tablet](../../../assets/customer-orders-completed-tablet.png) | ![`completed` — beserta riwayat aksi lengkap — mobile](../../../assets/customer-orders-completed-mobile.png) |

**`cancelled` — tetap di riwayat, tidak dihapus**

| Desktop                                                                                                           | Tablet                                                                                                          | Mobile                                                                                                          |
| ----------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| ![`cancelled` — tetap di riwayat, tidak dihapus — desktop](../../../assets/customer-orders-cancelled-desktop.png) | ![`cancelled` — tetap di riwayat, tidak dihapus — tablet](../../../assets/customer-orders-cancelled-tablet.png) | ![`cancelled` — tetap di riwayat, tidak dihapus — mobile](../../../assets/customer-orders-cancelled-mobile.png) |

**Struk siap cetak**

| Desktop                                                                            | Tablet                                                                           | Mobile                                                                           |
| ---------------------------------------------------------------------------------- | -------------------------------------------------------------------------------- | -------------------------------------------------------------------------------- |
| ![Struk siap cetak — desktop](../../../assets/customer-orders-receipt-desktop.png) | ![Struk siap cetak — tablet](../../../assets/customer-orders-receipt-tablet.png) | ![Struk siap cetak — mobile](../../../assets/customer-orders-receipt-mobile.png) |

→ bayar → barang kembali.

## Memantau

Halaman pesanan menampilkan tahap saat ini. Siklusnya:

1. **Penjemputan dijadwalkan** — sudah dipesan, menunggu kurir
2. **Dalam penjemputan** — sudah diambil, menuju toko
3. **Dalam inspeksi** — sedang diperiksa dan dihargai
4. **Menunggu pelunasan** — sudah dihargai, menunggu pelanggan membayar
5. **Dalam pencucian** — sudah lunas, sedang dikerjakan
6. Lalu **dalam pengantaran** (jika punya alamat) atau **siap diambil** (jika
   tidak)
7. **Selesai**

Halaman ini diperbarui langsung saat petugas memajukan pesanan — tanpa perlu
muat ulang.

## Membatalkan

Pesanan hanya bisa dibatalkan selama masih **penjemputan dijadwalkan** dan hanya
**sebelum tanggal jemput tiba**. Pada atau setelah hari penjemputan, pilihan
batal hilang — kurir mungkin sudah dalam perjalanan.

Membatalkan tidak menghapus apa pun. Pesanan tetap ada di daftar dengan tanda
dibatalkan.

## Struk

Setiap pesanan punya halaman struk siap cetak yang menampilkan barang, layanan
yang dikenakan pada tiap barang, dan totalnya.

→ Versi satu menit: [tldr.md](tldr.md)
→ Detail implementasi: [teknis.md](teknis.md)
