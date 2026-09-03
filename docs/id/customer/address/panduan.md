# Alamat — Panduan

Alamat adalah tempat UmimaClean menjemput barang dan mengantarkannya kembali.
Setiap pelanggan menyimpan tepat satu.

## Satu alamat, bukan daftar

Tidak ada buku alamat. Pelanggan punya satu alamat tersimpan. Menyimpan yang
baru menggantikan yang sebelumnya.

Ini penyederhanaan yang disengaja: layanannya adalah operasi antar-jemput lokal,
dan setiap pesanan seorang pelanggan menuju tempat yang sama kecuali mereka
pindah.

## Menetapkan alamat

Pelanggan membuka halaman alamat dan mendapat peta.

Mereka bisa menemukan lokasinya dengan tiga cara:

1. **Cari berdasarkan nama.** Mengetik nama tempat akan menanyakan layanan peta
   dan mengembalikan lokasi yang cocok. Yang penting, hasil di luar area layanan
   sudah disaring sebelum pelanggan melihatnya — jadi apa pun yang ditawarkan
   dijamin bisa dilayani.
2. **Penanda terdekat.** Aplikasi bisa mendaftar tempat-tempat dikenal di dekat
   suatu titik, membantu ketika alamat jalan yang persis belum jelas.
3. **Letakkan pin manual.** Seret penanda ke titik yang tepat.

Di samping peta mereka mengisi nama dan telepon penerima (boleh berbeda dari
pemilik akun — berguna saat barang dikirim ke kantor atau kerabat), alamat jalan
sebagai teks, dan catatan opsional untuk kurir.

## Pemeriksaan area layanan

Ketika form dikirim, aplikasi memeriksa apakah pin jatuh di dalam salah satu
area operasional.

Ini pemeriksaan geografis sungguhan terhadap bentuk poligon nyata, bukan jarak
dari satu titik pusat. Alamat yang hanya berjarak sedikit di seberang batas bisa
ditolak, sementara alamat yang lebih jauh tapi berada di lingkungan tercakup
justru diterima.

Jika pin di luar, penyimpanan ditolak dengan pesan bahwa lokasi berada di luar
jangkauan antar-jemput. Galatnya menempel pada field bernama `radius`, yang
sedikit keliru namanya — tidak ada radius yang terlibat.

## Apa yang terjadi pada alamat lama

Bagian ini layak dipahami.

Ketika alamat baru disimpan, aplikasi melihat apakah masih ada pesanan yang
merujuk alamat lama:

- **Tidak ada pesanan yang merujuk** → baris alamat lama dihapus langsung.
- **Ada pesanan yang merujuk** → baris lama disimpan tetapi ditandai nonaktif.

Kasus kedua penting untuk riwayat. Pesanan yang selesai enam bulan lalu semestinya
tetap menunjukkan ke mana barang diantar. Menghapus alamat akan merusak catatan
itu atau diam-diam menulis ulang masa lalu. Menyimpan salinan nonaktif
mempertahankannya.

Alamat nonaktif yang tidak dirujuk pesanan mana pun bisa disapu belakangan oleh
rutinitas pembersihan.

## Kenapa alamat menentukan pengantaran

Alamat tersimpanlah yang membuat sebuah pesanan bisa diantar.

- Pelanggan dengan alamat mendapat barang bersihnya **diantar**.
- Pesanan tanpa alamat berakhir di **siap diambil** — pelanggan datang ke toko.

Ini juga berlaku di konter: petugas yang menerima pesanan langsung hanya bisa
menawarkan pengantaran jika pelanggan punya akun **dan** akun itu punya alamat
tersimpan. Tanpa keduanya, pesanan berstatus diambil-di-toko.

## Batas pencarian

Pencarian lokasi dibatasi 30 permintaan per menit per pengguna. Peta mencari
sambil Anda mengetik, jadi angka ini longgar dalam pemakaian normal tetapi akan
tersandung bila ada yang berulang tanpa henti.

## Tangkapan Layar

Setiap keadaan di bawah ditampilkan pada tiga lebar — desktop (1440px), tablet (834px), dan mobile (430px). Gambar utama di atas memakai tampilan desktop, sesuai cara layar role ini biasa dipakai.

**Alamat tersimpan beserta pin petanya**

| Desktop                                                                                              | Tablet                                                                                             | Mobile                                                                                             |
| ---------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| ![Alamat tersimpan beserta pin petanya — desktop](../../../assets/customer-address-show-desktop.png) | ![Alamat tersimpan beserta pin petanya — tablet](../../../assets/customer-address-show-tablet.png) | ![Alamat tersimpan beserta pin petanya — mobile](../../../assets/customer-address-show-mobile.png) |

**Pemilih peta dengan pencarian dan tempat terdekat**

| Desktop                                                                                                             | Tablet                                                                                                            | Mobile                                                                                                            |
| ------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| ![Pemilih peta dengan pencarian dan tempat terdekat — desktop](../../../assets/customer-address-create-desktop.png) | ![Pemilih peta dengan pencarian dan tempat terdekat — tablet](../../../assets/customer-address-create-tablet.png) | ![Pemilih peta dengan pencarian dan tempat terdekat — mobile](../../../assets/customer-address-create-mobile.png) |

**Belum ada alamat tersimpan**

| Desktop                                                                                     | Tablet                                                                                    | Mobile                                                                                    |
| ------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| ![Belum ada alamat tersimpan — desktop](../../../assets/customer-address-empty-desktop.png) | ![Belum ada alamat tersimpan — tablet](../../../assets/customer-address-empty-tablet.png) | ![Belum ada alamat tersimpan — mobile](../../../assets/customer-address-empty-mobile.png) |

→ Versi satu menit: [tldr.md](tldr.md)
→ Detail implementasi: [teknis.md](teknis.md)
