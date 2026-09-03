# Pencucian & Serah Terima — Panduan

Begitu pelanggan membayar, barang masuk antrean cuci. Bagian ini membahas apa
yang terjadi sejak titik itu sampai barang kembali ke tangan pelanggan.

## Pencucian

Pesanan yang sudah lunas muncul di tab **pencucian**. Berbeda dengan perjalanan
dan inspeksi, pesanan ini tidak diklaim — beberapa orang mengerjakan area cuci
pada saat bersamaan, dan mengunci tiap pesanan ke satu orang justru menghalangi.

Ketika barang selesai dicuci, petugas menandai pesanan sebagai selesai dan
melampirkan **foto** hasil pekerjaannya. Foto itu adalah catatan tentang apa yang
dikembalikan dan dalam kondisi apa.

### Apa yang terjadi berikutnya bergantung pada alamat

Inilah percabangan yang membentuk sisa hidup pesanan.

- **Pesanan punya alamat pengantaran** → pesanan pindah ke antrean pengantaran,
  dan kurir akan mengantarkannya kembali.
- **Pesanan tidak punya alamat** → pesanan pindah ke _siap diambil_, dan
  pelanggan datang ke toko.

Petugas tidak memilih. Aplikasi yang memutuskan berdasarkan ada tidaknya alamat,
dan pesan konfirmasinya memberi tahu mana yang terjadi.

Inilah sebabnya [alamat](../../customer/address/) begitu penting: alamatlah yang
membuat sebuah pesanan bisa diantar. Pesanan konter dari pelanggan langsung tanpa
akun tidak punya alamat, jadi selalu berakhir sebagai diambil-di-toko.

## Memberi tahu pelanggan

Tidak ada yang perlu mengingatnya. Sekali sehari aplikasi mengirim **pesan
WhatsApp** kepada setiap pelanggan yang pesanannya menunggu diambil, memberitahu
bahwa barang sudah siap.

Tiga hal layak diketahui:

**Hanya terkirim sekali.** Aplikasi mengingat bahwa pemberitahuan sudah dikirim
untuk sebuah pesanan, jadi jalannya perintah esok hari melewatinya. Pelanggan
tidak diganggu berulang kali.

**Pesanan yang sudah keburu diambil dibiarkan.** Status setiap pesanan diperiksa
ulang tepat sebelum pesan dikirim, jadi tidak ada pelanggan yang dikabari
barangnya siap setelah ia membawanya pulang.

**Kegagalan pengiriman tidak memblokir apa pun.** Jika WhatsApp tidak dapat
dihubungi untuk satu pelanggan, sisa rondenya tetap terkirim dan pesanan itu
dicoba lagi pada jalannya perintah esok hari.

## Menyerahkan barang

Ketika pelanggan datang, petugas menandai pesanan sebagai sudah diambil. Ini
aksi paling sederhana dalam aplikasi: tanpa foto, tanpa klaim, tanpa form.
Pesanan pindah ke **selesai** dan pekerjaannya rampung.

Karena tidak ada klaim, siapa pun yang sedang berdiri di konter bisa
melakukannya. Aplikasi tetap mencatat siapa yang melakukannya dan kapan.

## Label

Ada halaman **label** siap cetak untuk tiap pesanan, menampilkan rincian
pesanannya. Inilah yang ditempelkan pada barang fisik supaya bisa dikenali di
area cuci dan dicocokkan kembali dengan pelanggan yang tepat.

Halaman label bisa dibuka untuk pesanan mana pun, pada tahap mana pun.

## Perbandingan singkat

|                    | Foto? | Diklaim? | Memindahkan pesanan ke          |
| ------------------ | ----- | -------- | ------------------------------- |
| Selesai dicuci     | ya    | tidak    | pengantaran _atau_ siap-diambil |
| Pemberitahuan siap | —     | tidak    | (tanpa perubahan status)        |
| Sudah diambil      | tidak | tidak    | selesai                         |

## Tangkapan Layar

Setiap keadaan di bawah ditampilkan pada tiga lebar — desktop (1440px), tablet (834px), dan mobile (430px). Gambar utama di atas memakai tampilan mobile, sesuai cara layar role ini biasa dipakai.

**Label siap cetak yang ditempel pada barang fisik**

| Desktop                                                                                                                  | Tablet                                                                                                                 | Mobile                                                                                                                 |
| ------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| ![Label siap cetak yang ditempel pada barang fisik — desktop](../../../assets/staff-cleaning-collection-tag-desktop.png) | ![Label siap cetak yang ditempel pada barang fisik — tablet](../../../assets/staff-cleaning-collection-tag-tablet.png) | ![Label siap cetak yang ditempel pada barang fisik — mobile](../../../assets/staff-cleaning-collection-tag-mobile.png) |

→ Versi satu menit: [tldr.md](tldr.md)
→ Detail implementasi: [teknis.md](teknis.md)
