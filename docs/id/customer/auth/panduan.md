# Autentikasi — Panduan

Bagian ini menjelaskan apa yang benar-benar dialami pelanggan saat masuk ke
aplikasi, dengan bahasa sehari-hari. Tanpa kode.

## Membuat akun

Pelanggan baru menekan **Daftar** dan mengisi tiga hal: nama, nomor telepon, dan
kata sandi (diketik dua kali).

- **Nama** menerima huruf, spasi, dan tanda hubung — maksimal 50 karakter. Angka
  dan tanda baca ditolak, jadi "Budi Santoso" dan "Ana-Maria" bisa, tetapi
  "Budi123" tidak.
- **Telepon** harus nomor seluler Indonesia yang valid. Aplikasi menormalkan apa
  yang Anda ketik, jadi `0812...`, `+62812...`, dan `62812...` tersimpan dengan
  bentuk yang sama. Jika nomor itu sudah terdaftar, pendaftaran gagal dan
  memberi tahu.
- **Kata sandi** harus 8 sampai 16 karakter dan wajib memuat **huruf dan angka
  sekaligus**. Simbol sama sekali tidak diizinkan.

Tidak ada langkah konfirmasi email dan tidak ada kode SMS saat mendaftar. Begitu
form diterima, akun langsung ada dan pelanggan dibawa masuk ke aplikasi.

## Masuk

Login meminta nomor telepon dan kata sandi, dengan centang **Ingat saya** yang
opsional.

Ke mana Anda diarahkan setelah masuk bergantung pada role — pelanggan ke halaman
profilnya, petugas ke profil petugas, admin ke profil admin. Ini otomatis; tidak
ada pemilih role.

Petugas dan admin tidak memakai halaman login publik. Mereka punya pintu masuk
terpisah di `/internal/login`. Di balik layar formnya sama — pemisahan ini ada
agar halaman untuk pelanggan tetap sederhana dan pintu internal tidak dipajang.

Jika Anda sudah masuk, halaman login dan daftar akan mengalihkan Anda. Halaman
itu tidak bisa dilihat selama sesi masih dipegang.

## Lupa kata sandi

Pelanggan memasukkan nomor teleponnya di halaman **Lupa kata sandi**. Jika ada
akun untuk nomor itu, tautan atur ulang dikirim lewat WhatsApp.

**Ini dibatasi satu permintaan tiap 15 menit.** Jika seseorang menekan tombolnya
dua kali, percobaan kedua ditolak dengan pesan galat alih-alih mengirim tautan
kedua. Ini disengaja — supaya endpoint pengirim WhatsApp tidak dipakai untuk
mengganggu orang.

Mengikuti tautan itu membuka halaman untuk menetapkan kata sandi baru, diketik
dua kali. Aturan 8–16 karakter huruf-dan-angka tetap berlaku.

Setelah kata sandi diganti, **semua sesi "ingat saya" untuk akun itu dicabut.**
Jika akun sempat dibajak, mengganti kata sandi mengeluarkan penyerang dari semua
perangkat. Orang yang mengatur ulang harus masuk lagi dengan kata sandi baru.

## Keluar

Satu aksi **Keluar** mengakhiri sesi. Aksi ini menuntut status masuk, jadi tab
lama yang sudah keluar di tempat lain akan langsung dilempar ke halaman login.

## Kapan Anda diblokir

Aplikasi sengaja memperlambat percobaan berulang:

| Aksi                  | Diizinkan      | Lalu diblokir |
| --------------------- | -------------- | ------------- |
| Daftar                | 10 per menit   | 10 menit      |
| Masuk                 | 5 per menit    | 5 menit       |
| Lupa kata sandi       | 1 per 15 menit | 15 menit      |
| Atur ulang kata sandi | 5 per 15 menit | 15 menit      |

Login menghitung percobaan per IP **dan** nomor telepon sekaligus, jadi satu
orang yang lupa kata sandinya tidak mengunci semua orang lain di Wi-Fi kantor
yang sama.

Jika Anda kena batas saat pengujian dan tidak ingin menunggu, penghitungnya ada
di tabel basis data `rate_limits` dan bisa dikosongkan.

## Tangkapan Layar

Setiap keadaan di bawah ditampilkan pada tiga lebar — desktop (1440px), tablet (834px), dan mobile (430px). Gambar utama di atas memakai tampilan desktop, sesuai cara layar role ini biasa dipakai.

**Halaman depan publik**

| Desktop                                                                    | Tablet                                                                   | Mobile                                                                   |
| -------------------------------------------------------------------------- | ------------------------------------------------------------------------ | ------------------------------------------------------------------------ |
| ![Halaman depan publik — desktop](../../../assets/public-home-desktop.png) | ![Halaman depan publik — tablet](../../../assets/public-home-tablet.png) | ![Halaman depan publik — mobile](../../../assets/public-home-mobile.png) |

**Masuk pelanggan**

| Desktop                                                                       | Tablet                                                                      | Mobile                                                                      |
| ----------------------------------------------------------------------------- | --------------------------------------------------------------------------- | --------------------------------------------------------------------------- |
| ![Masuk pelanggan — desktop](../../../assets/customer-auth-login-desktop.png) | ![Masuk pelanggan — tablet](../../../assets/customer-auth-login-tablet.png) | ![Masuk pelanggan — mobile](../../../assets/customer-auth-login-mobile.png) |

**Masuk petugas & admin (`/internal/login`)**

| Desktop                                                                                                          | Tablet                                                                                                         | Mobile                                                                                                         |
| ---------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| ![Masuk petugas & admin (`/internal/login`) — desktop](../../../assets/customer-auth-internal-login-desktop.png) | ![Masuk petugas & admin (`/internal/login`) — tablet](../../../assets/customer-auth-internal-login-tablet.png) | ![Masuk petugas & admin (`/internal/login`) — mobile](../../../assets/customer-auth-internal-login-mobile.png) |

**Form pendaftaran**

| Desktop                                                                         | Tablet                                                                        | Mobile                                                                        |
| ------------------------------------------------------------------------------- | ----------------------------------------------------------------------------- | ----------------------------------------------------------------------------- |
| ![Form pendaftaran — desktop](../../../assets/customer-auth-signup-desktop.png) | ![Form pendaftaran — tablet](../../../assets/customer-auth-signup-tablet.png) | ![Form pendaftaran — mobile](../../../assets/customer-auth-signup-mobile.png) |

**Pendaftaran dengan konfirmasi tidak cocok**

| Desktop                                                                                                        | Tablet                                                                                                       | Mobile                                                                                                       |
| -------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------ |
| ![Pendaftaran dengan konfirmasi tidak cocok — desktop](../../../assets/customer-auth-signup-error-desktop.png) | ![Pendaftaran dengan konfirmasi tidak cocok — tablet](../../../assets/customer-auth-signup-error-tablet.png) | ![Pendaftaran dengan konfirmasi tidak cocok — mobile](../../../assets/customer-auth-signup-error-mobile.png) |

**Permintaan lupa kata sandi**

| Desktop                                                                                            | Tablet                                                                                           | Mobile                                                                                           |
| -------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------ |
| ![Permintaan lupa kata sandi — desktop](../../../assets/customer-auth-forgot-password-desktop.png) | ![Permintaan lupa kata sandi — tablet](../../../assets/customer-auth-forgot-password-tablet.png) | ![Permintaan lupa kata sandi — mobile](../../../assets/customer-auth-forgot-password-mobile.png) |

**Form atur ulang kata sandi**

| Desktop                                                                                           | Tablet                                                                                          | Mobile                                                                                          |
| ------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| ![Form atur ulang kata sandi — desktop](../../../assets/customer-auth-reset-password-desktop.png) | ![Form atur ulang kata sandi — tablet](../../../assets/customer-auth-reset-password-tablet.png) | ![Form atur ulang kata sandi — mobile](../../../assets/customer-auth-reset-password-mobile.png) |

→ Versi satu menit: [tldr.md](tldr.md)
→ Detail implementasi: [teknis.md](teknis.md)
