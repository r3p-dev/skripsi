# Profil Admin — Panduan

Tempat admin mengelola akunnya sendiri. Perilakunya identik dengan halaman
profil pelanggan dan petugas.

## Ke mana admin mendarat

Setelah masuk, admin tiba di **halaman profilnya** — bukan dasbor. Dasbornya
berjarak satu langkah di `/admin`.

Admin masuk lewat pintu internal di `/internal/login`, pintu yang sama dipakai
petugas.

## Tiga form

**Nama** — huruf, spasi, dan tanda hubung, sampai 50 karakter. Tersimpan seketika.

**Kata sandi** — menuntut kata sandi saat ini plus yang baru dua kali. Kata sandi
baru 8 sampai 16 karakter dengan huruf dan angka, tanpa simbol. Ini tidak
mengeluarkan mereka dari perangkat lain.

**Telepon** — penggantian dua langkah. Masukkan nomor baru, terima tautan
verifikasi WhatsApp **di nomor baru itu**, buka untuk mengonfirmasi. Tautannya
berlaku 15 menit.

Karena nomor telepon adalah identitas login untuk semua role, langkah verifikasi
ini sama pentingnya bagi admin seperti bagi pelanggan — bisa dibilang lebih
penting.

## Dua cara admin menyunting akun

Ini layak diperjelas, karena admin bisa menjangkau akunnya sendiri dari dua
tempat.

**Halaman ini** hanya menyunting nama, kata sandi, dan telepon. Ia tidak bisa
menyentuh role atau status aktif. Ia selalu bekerja pada siapa pun yang sedang
masuk.

**Layar [manajemen pengguna](../users/)** bisa menyunting akun mana pun termasuk
akunnya sendiri, dan bisa mengubah role serta status aktif. Ketika admin membuka
catatannya sendiri di sana, aplikasi menandainya sebagai "ini Anda" supaya
mereka tahu.

Ketimpangan pentingnya: admin **tidak bisa menghapus akunnya sendiri** — itu
diblokir tegas dengan pesan yang jelas. Tetapi mereka **bisa menonaktifkan**
dirinya sendiri lewat layar pengguna, dan jika sakelar aktif tidak dikirimkan,
akunnya dinonaktifkan secara bawaan. Admin yang ceroboh pada form itu bisa
mengunci dirinya sendiri di luar.

## Yang tidak ada di sini

Tidak ada akses ke profil orang lain, tidak ada manajemen role, tidak ada daftar
pengguna. Semua itu berada di [users](../users/).

## Layak diketahui

Halaman ini adalah kode yang sama dengan halaman profil pelanggan dan petugas,
dipasang pada prefix berbeda. Perubahan di sini mengubah ketiga role sekaligus.

## Tangkapan Layar

Setiap keadaan di bawah ditampilkan pada tiga lebar — desktop (1440px), tablet (834px), dan mobile (430px). Gambar utama di atas memakai tampilan desktop, sesuai cara layar role ini biasa dipakai.

**Halaman akun admin sendiri**

| Desktop                                                                                 | Tablet                                                                                | Mobile                                                                                |
| --------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| ![Halaman akun admin sendiri — desktop](../../../assets/admin-profile-show-desktop.png) | ![Halaman akun admin sendiri — tablet](../../../assets/admin-profile-show-tablet.png) | ![Halaman akun admin sendiri — mobile](../../../assets/admin-profile-show-mobile.png) |

→ Versi satu menit: [tldr.md](tldr.md)
→ Detail implementasi: [teknis.md](teknis.md)
