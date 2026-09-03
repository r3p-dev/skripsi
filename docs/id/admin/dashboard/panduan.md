# Dasbor — Panduan

Tampilan pendaratan admin: satu layar yang menjawab "bagaimana kondisi toko saat
ini?"

Sifatnya murni informatif. Tidak ada di dalamnya yang mengubah apa pun.

## Angka ringkasan

Di bagian atas, sederet angka utama:

- **Total pesanan** yang pernah dibuat
- **Pesanan aktif** — pekerjaan yang sedang berjalan
- **Pesanan selesai**
- **Menunggu pelunasan** — pesanan yang sudah dihargai tetapi belum dibayar
- **Pendapatan** — uang yang benar-benar sudah lunas
- Jumlah **pelanggan** dan **petugas**

### Apa arti "aktif"

Ini layak dipastikan, karena mudah disalahartikan.

"Aktif" bukan sekadar "belum selesai". Ia menghitung pesanan dalam tujuh tahap
spesifik: penjemputan dijadwalkan, dalam penjemputan, dalam inspeksi, menunggu
pelunasan, dalam pencucian, siap diambil, dan dalam pengantaran.

Pesanan selesai dan dibatalkan tidak termasuk. Jadi aktif + selesai tidak akan
sama dengan total kecuali Anda juga menghitung pembatalan.

### Apa arti "pendapatan"

Pendapatan hanya menghitung uang yang benar-benar sudah lunas — pembayaran yang
dikonfirmasi baik oleh gerbang pembayaran maupun oleh admin yang menandainya
lunas.

Pesanan yang sudah dihargai tetapi belum dibayar tidak menyumbang apa pun,
sebesar apa pun nilainya. Itu disengaja: angka ini adalah uang yang diterima,
bukan uang yang terutang. Jumlah menunggu-pelunasan adalah tempat Anda melihat
apa yang masih tertunggak.

## Rinciannya

Dua sebaran: pesanan menurut **status** dan pesanan menurut **tipe** (online,
offline, langsung-dengan-antar).

Keduanya mendaftar **semua nilai yang mungkin**, termasuk yang jumlahnya nol.
Status yang belum pernah dipakai siapa pun tetap muncul dengan nol alih-alih
menghilang. Ini menjaga bentuk grafik tetap stabil antar pemuatan halaman
alih-alih membuat kategori muncul dan hilang.

## Tren pendapatan

Pendapatan lunas harian selama **14 hari** terakhir.

Hari tanpa pendapatan ditampilkan sebagai nol alih-alih dilewati, sehingga
garisnya menyambung dan jaraknya jujur — minggu yang sepi terlihat sepi
ketimbang dipadatkan hingga hilang.

## Beban penjemputan

Pandangan ke depan sejauh **7 hari**, menampilkan untuk tiap hari berapa
penjemputan yang sudah dipesan dibanding kapasitas harian sebesar 10.

Inilah alat perencanaannya. Ia menunjukkan di mana tekanannya sebelum tekanan
itu tiba.

Pesanan yang dibatalkan tidak dihitung, dan hanya penjemputan yang masih menunggu
diambil yang menempati slot — begitu kurir menjemput sebuah pesanan, slotnya
bebas.

## Pesanan terbaru

**8 pesanan yang paling baru dibuat**, terbaru dulu, sebagai denyut cepat tentang
apa yang sedang masuk.

## Catatan performa

Keenam blok diambil **pada saat yang sama** alih-alih satu demi satu. Karena itu
halamannya memakan waktu kira-kira selama kueri tunggal yang paling lambat, bukan
jumlah semuanya.

## Tangkapan Layar

Setiap keadaan di bawah ditampilkan pada tiga lebar — desktop (1440px), tablet (834px), dan mobile (430px). Gambar utama di atas memakai tampilan desktop, sesuai cara layar role ini biasa dipakai.

**Dasbor — ringkasan, tren, beban penjemputan, pesanan terbaru**

| Desktop                                                                                                                      | Tablet                                                                                                                     | Mobile                                                                                                                     |
| ---------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| ![Dasbor — ringkasan, tren, beban penjemputan, pesanan terbaru — desktop](../../../assets/admin-dashboard-index-desktop.png) | ![Dasbor — ringkasan, tren, beban penjemputan, pesanan terbaru — tablet](../../../assets/admin-dashboard-index-tablet.png) | ![Dasbor — ringkasan, tren, beban penjemputan, pesanan terbaru — mobile](../../../assets/admin-dashboard-index-mobile.png) |

→ Versi satu menit: [tldr.md](tldr.md)
→ Detail implementasi: [teknis.md](teknis.md)
