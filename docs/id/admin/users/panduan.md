# Pengguna — Panduan

Tempat akun dibuat, disunting, dan diberi role-nya.

## Kenapa layar ini penting

Pendaftaran publik hanya bisa membuat **pelanggan**. Tidak ada cara bagi seseorang
mendaftar sebagai petugas atau admin, dan tidak ada cara bagi petugas menaikkan
haknya sendiri.

Jadi layar inilah satu-satunya jalan seseorang menjadi petugas atau admin. Inilah
batas hak istimewa aplikasi.

## Daftarnya

Semua akun, terbaru dulu, sepuluh per halaman. Bisa disaring per role dan dicari
berdasarkan nama atau nomor telepon — kecocokan sebagian berfungsi.

Halamannya juga menampilkan berapa akun yang ada pada tiap role.

## Membuat akun

Admin memasukkan nama, nomor telepon, kata sandi, dan role. Aturannya sama seperti
pendaftaran publik: nama berisi huruf, spasi, dan tanda hubung; nomor telepon
harus nomor seluler Indonesia yang valid dan unik; kata sandi 8 sampai 16
karakter dengan huruf dan angka tanpa simbol.

Akunnya langsung bisa dipakai. Tidak ada langkah undangan atau aktivasi.

## Menyunting akun

Penyuntingan bisa mengubah nama, telepon, role, dan status aktif, serta secara
opsional menetapkan kata sandi baru.

**Kata sandi hanya berubah bila benar-benar diketik.** Menyimpan suntingan untuk
membetulkan nama tidak akan mengatur ulang login orang tersebut. Ini penting —
kalau tidak, mudah sekali mengunci seseorang secara tidak sengaja.

**Mengganti nomor telepon di sini melewati verifikasi WhatsApp.** Ketika pengguna
mengganti nomornya sendiri, mereka harus mengonfirmasi lewat tautan. Ketika admin
menggantinya, nomornya langsung berubah. Itu disengaja — admin yang membetulkan
salah ketik semestinya tidak perlu kerja sama penggunanya — tetapi artinya admin
bisa menetapkan nomor yang tidak dikuasai penggunanya.

### Menonaktifkan

Akun bisa ditandai nonaktif alih-alih dihapus. Inilah cara yang dimaksudkan untuk
memensiunkan seseorang: riwayatnya tetap utuh dan akunnya berhenti bisa dipakai.

**Berhati-hatilah dengan sakelar aktif.** Jika form dikirim tanpa field itu
ditetapkan, akunnya dinonaktifkan secara bawaan. Admin yang menyunting akunnya
sendiri bisa mengunci dirinya dengan cara ini. Aplikasi memperingatkan ketika
Anda menyunting diri sendiri, tetapi tidak mencegahnya.

## Menghapus akun

Penghapusan ditolak dalam dua kasus.

**Anda tidak bisa menghapus diri sendiri.** Ini diperiksa langsung dan memberi
pesan yang jelas.

**Anda tidak bisa menghapus akun yang punya riwayat pesanan.** Akun mana pun yang
pernah membuat pesanan dilindungi, karena menghapusnya akan membuat riwayat itu
yatim — pesanannya akan menunjuk pengguna yang tidak ada lagi.

Layar daftar mengetahui akun mana yang dilindungi sehingga pilihan hapusnya bisa
disembunyikan alih-alih gagal saat diklik.

Dalam praktiknya ini berarti sebagian besar akun sungguhan tidak bisa dihapus
selamanya, dan penonaktifanlah alat yang benar-benar Anda pakai. Penghapusan
sebenarnya hanya untuk akun yang dibuat karena keliru dan tidak pernah melakukan
apa pun.

## Yang berada di tempat lain

Admin yang menyunting nama, kata sandi, atau telepon **miliknya sendiri** lewat
halaman [profil](../profile/) biasa mengikuti aturan berbeda — jalur itu tidak
bisa menyentuh role atau status aktif, dan ia memang menuntut kata sandi saat ini
untuk mengganti kata sandi.

## Tangkapan Layar

Setiap keadaan di bawah ditampilkan pada tiga lebar — desktop (1440px), tablet (834px), dan mobile (430px). Gambar utama di atas memakai tampilan desktop, sesuai cara layar role ini biasa dipakai.

**Semua akun dengan jumlah per role**

| Desktop                                                                                       | Tablet                                                                                      | Mobile                                                                                      |
| --------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| ![Semua akun dengan jumlah per role — desktop](../../../assets/admin-users-index-desktop.png) | ![Semua akun dengan jumlah per role — tablet](../../../assets/admin-users-index-tablet.png) | ![Semua akun dengan jumlah per role — mobile](../../../assets/admin-users-index-mobile.png) |

**Disaring ke petugas**

| Desktop                                                                            | Tablet                                                                           | Mobile                                                                           |
| ---------------------------------------------------------------------------------- | -------------------------------------------------------------------------------- | -------------------------------------------------------------------------------- |
| ![Disaring ke petugas — desktop](../../../assets/admin-users-filtered-desktop.png) | ![Disaring ke petugas — tablet](../../../assets/admin-users-filtered-tablet.png) | ![Disaring ke petugas — mobile](../../../assets/admin-users-filtered-mobile.png) |

**Membuat akun — satu-satunya jalan ke petugas/admin**

| Desktop                                                                                                         | Tablet                                                                                                        | Mobile                                                                                                        |
| --------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| ![Membuat akun — satu-satunya jalan ke petugas/admin — desktop](../../../assets/admin-users-create-desktop.png) | ![Membuat akun — satu-satunya jalan ke petugas/admin — tablet](../../../assets/admin-users-create-tablet.png) | ![Membuat akun — satu-satunya jalan ke petugas/admin — mobile](../../../assets/admin-users-create-mobile.png) |

**Menyunting akun lain**

| Desktop                                                                         | Tablet                                                                        | Mobile                                                                        |
| ------------------------------------------------------------------------------- | ----------------------------------------------------------------------------- | ----------------------------------------------------------------------------- |
| ![Menyunting akun lain — desktop](../../../assets/admin-users-edit-desktop.png) | ![Menyunting akun lain — tablet](../../../assets/admin-users-edit-tablet.png) | ![Menyunting akun lain — mobile](../../../assets/admin-users-edit-mobile.png) |

**Menyunting akun sendiri (`isSelf`)**

| Desktop                                                                                            | Tablet                                                                                           | Mobile                                                                                           |
| -------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------ |
| ![Menyunting akun sendiri (`isSelf`) — desktop](../../../assets/admin-users-edit-self-desktop.png) | ![Menyunting akun sendiri (`isSelf`) — tablet](../../../assets/admin-users-edit-self-tablet.png) | ![Menyunting akun sendiri (`isSelf`) — mobile](../../../assets/admin-users-edit-self-mobile.png) |

→ Versi satu menit: [tldr.md](tldr.md)
→ Detail implementasi: [teknis.md](teknis.md)
