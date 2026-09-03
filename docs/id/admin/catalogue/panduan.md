# Katalog — Panduan

Katalog adalah daftar harga toko. Setiap harga yang akhirnya melekat pada sebuah
pesanan berasal dari sini.

## Apa itu entri katalog

Tiap entri menjelaskan satu layanan yang dijual toko:

- **Nama** — sebutannya, 3 sampai 100 karakter
- **Deskripsi** — 3 sampai 255 karakter
- **Harga**
- **Kategori** — jenis pekerjaannya
- **Tipe** — bagaimana harganya harus dibaca

## Kategori menentukan berlakunya untuk apa

Kategori bukan sekadar label pengelompokan. Ia mengendalikan barang mana yang
bisa dikenai layanan tersebut saat inspeksi:

| Kategori        | Ditawarkan untuk |
| --------------- | ---------------- |
| Cuci sepatu     | Sepatu           |
| Reparasi sepatu | Sepatu           |
| Cuci tas        | Tas              |
| Cuci helm       | Helm             |
| Tambahan        | Semuanya         |

Jadi membuat layanan di bawah "cuci tas" berarti petugas tidak akan pernah
melihatnya saat menginspeksi helm. Jika sebuah layanan tidak muncul di tempat
yang diharapkan, kategorilah hal pertama yang perlu diperiksa.

**Tambahan** adalah pengecualiannya. Layanan tambahan tidak terikat pada jenis
barang mana pun, karena hal seperti pelapis pelindung atau biaya kilat berlaku
sama baiknya untuk sepatu maupun tas.

## Tipe

Tipe mengendalikan bagaimana harga disajikan: harga tetap, harga "mulai dari"
untuk pekerjaan yang bervariasi, atau layanan tambahan.

## Mengubah harga

Harga bisa diubah kapan saja, termasuk pada layanan yang sudah pernah dipesan.

Ini aman karena **harganya disalin ke pesanan pada saat inspeksi**. Cuci sepatu
yang dihargai hari ini menyimpan harga hari ini selamanya, sekalipun katalognya
berubah besok. Struk lama tetap akurat.

## Menghapus

Entri katalog hanya bisa dihapus jika **belum pernah dipakai pesanan mana pun**.

Jika sudah dipakai, penghapusan ditolak dengan pesan bahwa layanan itu sudah
pernah dipesan. Layar daftar mengetahui entri mana yang terpakai sehingga pilihan
hapusnya bisa disembunyikan alih-alih gagal saat diklik.

Alasannya adalah keterlacakan. Meski harga dan nama sudah disalin ke baris
pesanan, tiap baris tetap menunjuk balik ke entri katalognya. Menghapusnya akan
memutus tautan yang diikuti admin ketika memeriksa struk.

Konsekuensi praktisnya: **Anda tidak bisa merapikan layanan lama.** Layanan yang
sudah tidak ditawarkan toko tetapi pernah terjual akan bertahan di daftar
selamanya. Tidak ada penanda arsip atau sembunyikan — jika itu menjadi masalah,
dibutuhkan kolom baru.

## Menemukan entri

Daftarnya bisa dicari berdasarkan nama dan deskripsi, terbaru dulu, sepuluh per
halaman.

## Tangkapan Layar

Setiap keadaan di bawah ditampilkan pada tiga lebar — desktop (1440px), tablet (834px), dan mobile (430px). Gambar utama di atas memakai tampilan desktop, sesuai cara layar role ini biasa dipakai.

**Daftar layanan dengan penanda sedang-terpakai**

| Desktop                                                                                                       | Tablet                                                                                                      | Mobile                                                                                                      |
| ------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| ![Daftar layanan dengan penanda sedang-terpakai — desktop](../../../assets/admin-catalogue-index-desktop.png) | ![Daftar layanan dengan penanda sedang-terpakai — tablet](../../../assets/admin-catalogue-index-tablet.png) | ![Daftar layanan dengan penanda sedang-terpakai — mobile](../../../assets/admin-catalogue-index-mobile.png) |

**Menambah layanan**

| Desktop                                                                           | Tablet                                                                          | Mobile                                                                          |
| --------------------------------------------------------------------------------- | ------------------------------------------------------------------------------- | ------------------------------------------------------------------------------- |
| ![Menambah layanan — desktop](../../../assets/admin-catalogue-create-desktop.png) | ![Menambah layanan — tablet](../../../assets/admin-catalogue-create-tablet.png) | ![Menambah layanan — mobile](../../../assets/admin-catalogue-create-mobile.png) |

**Menyunting layanan yang sudah pernah dipesan**

| Desktop                                                                                                     | Tablet                                                                                                    | Mobile                                                                                                    |
| ----------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| ![Menyunting layanan yang sudah pernah dipesan — desktop](../../../assets/admin-catalogue-edit-desktop.png) | ![Menyunting layanan yang sudah pernah dipesan — tablet](../../../assets/admin-catalogue-edit-tablet.png) | ![Menyunting layanan yang sudah pernah dipesan — mobile](../../../assets/admin-catalogue-edit-mobile.png) |

**Menyunting layanan yang belum terpakai — penghapusan masih tersedia**

| Desktop                                                                                                                                   | Tablet                                                                                                                                  | Mobile                                                                                                                                  |
| ----------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| ![Menyunting layanan yang belum terpakai — penghapusan masih tersedia — desktop](../../../assets/admin-catalogue-edit-unused-desktop.png) | ![Menyunting layanan yang belum terpakai — penghapusan masih tersedia — tablet](../../../assets/admin-catalogue-edit-unused-tablet.png) | ![Menyunting layanan yang belum terpakai — penghapusan masih tersedia — mobile](../../../assets/admin-catalogue-edit-unused-mobile.png) |

→ Versi satu menit: [tldr.md](tldr.md)
→ Detail implementasi: [teknis.md](teknis.md)
