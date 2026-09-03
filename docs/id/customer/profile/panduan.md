# Profil — Panduan

Halaman profil adalah tempat pelanggan mengelola akunnya sendiri. Di dalamnya
ada tiga form yang berdiri sendiri.

## Mengganti nama

Yang paling sederhana. Ketik nama baru, kirim, selesai.

Aturan penamaan sama seperti saat mendaftar: hanya huruf, spasi, dan tanda
hubung, 1 sampai 50 karakter. Angka dan tanda baca ditolak.

## Mengganti kata sandi

Form ini meminta tiga hal: kata sandi **saat ini**, kata sandi baru, dan kata
sandi baru sekali lagi.

Kata sandi saat ini benar-benar diperiksa. Jika salah, galatnya muncul menempel
pada field itu — jadi pelanggan bisa melihat bahwa yang keliru adalah kata sandi
lama, bukan yang baru.

Kata sandi baru mengikuti aturan yang sama seperti di seluruh aplikasi: 8 sampai
16 karakter, wajib memuat huruf dan angka, tanpa simbol.

Perhatikan bahwa berbeda dengan _atur ulang_ kata sandi (alur lupa kata sandi),
mengganti kata sandi dari halaman profil **tidak** mengeluarkan pelanggan dari
perangkat lain. Hanya atur ulang yang melakukan itu.

## Mengganti nomor telepon

Ini yang paling berliku, karena nomor telepon adalah identitas login. Aplikasi
tidak begitu saja percaya pada ucapan pelanggan.

**Langkah satu — mengajukan.** Pelanggan mengetik nomor baru dan mengirim.
Aplikasi langsung memeriksa dua hal:

- Nomor baru tidak sama dengan nomor saat ini.
- Nomor baru belum dipakai akun lain.

Jika salah satu gagal, galat muncul di field telepon saat itu juga.

**Langkah dua — verifikasi.** Jika lolos, pesan WhatsApp dikirim **ke nomor
baru** berisi tautan verifikasi. Akun belum berubah pada tahap ini.

**Langkah tiga — konfirmasi.** Membuka tautan itulah yang menyelesaikan
penggantian. Tautannya bertanda tangan dan terikat pada akun, serta kedaluwarsa
setelah 15 menit. Jika diutak-atik, kedaluwarsa, atau dibuka saat masuk sebagai
orang lain, aplikasi menampilkan halaman "tanda tangan tidak valid".

### Kenapa ini penting dipahami

Pesannya dikirim ke nomor **baru**, bukan nomor sekarang. Itulah intinya — untuk
membuktikan pelanggan benar-benar menguasai nomor yang dituju.

Tetapi ada konsekuensinya: jika mereka salah ketik nomor, tautan terkirim ke
siapa pun pemilik nomor yang diketik. Pelanggan melihat pesan "permintaan
terkirim" yang menyenangkan, lalu tidak terjadi apa-apa. Tidak ada pantulan,
tidak ada peringatan. Mereka harus sadar sendiri dan mengajukan ulang.

Ada kehalusan kedua. Nomor itu **tidak dipesan** selama 15 menit tersebut.
Ketersediaan diperiksa lagi saat tautan dibuka. Jadi jika dua orang mengajukan
nomor yang sama bersamaan, keduanya menerima tautan, dan siapa yang klik lebih
dulu dia yang menang. Yang lain mendapat galat bahwa nomor sudah dipakai.

## Yang tidak ada di sini

Alamat tersimpan **bukan** bagian dari profil — alamat punya domain sendiri di
[address](../address/). Riwayat pesanan ada di [orders](../orders/).

## Tangkapan Layar

Setiap keadaan di bawah ditampilkan pada tiga lebar — desktop (1440px), tablet (834px), dan mobile (430px). Gambar utama di atas memakai tampilan desktop, sesuai cara layar role ini biasa dipakai.

**Halaman profil — baris nama, telepon, dan kata sandi**

| Desktop                                                                                                              | Tablet                                                                                                             | Mobile                                                                                                             |
| -------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------ |
| ![Halaman profil — baris nama, telepon, dan kata sandi — desktop](../../../assets/customer-profile-show-desktop.png) | ![Halaman profil — baris nama, telepon, dan kata sandi — tablet](../../../assets/customer-profile-show-tablet.png) | ![Halaman profil — baris nama, telepon, dan kata sandi — mobile](../../../assets/customer-profile-show-mobile.png) |

**Kata sandi saat ini salah, ditandai pada field-nya sendiri**

| Desktop                                                                                                                              | Tablet                                                                                                                             | Mobile                                                                                                                             |
| ------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| ![Kata sandi saat ini salah, ditandai pada field-nya sendiri — desktop](../../../assets/customer-profile-password-error-desktop.png) | ![Kata sandi saat ini salah, ditandai pada field-nya sendiri — tablet](../../../assets/customer-profile-password-error-tablet.png) | ![Kata sandi saat ini salah, ditandai pada field-nya sendiri — mobile](../../../assets/customer-profile-password-error-mobile.png) |

→ Versi satu menit: [tldr.md](tldr.md)
→ Detail implementasi: [teknis.md](teknis.md)
