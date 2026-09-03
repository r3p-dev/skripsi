# Pembayaran — Panduan

Bagaimana pelanggan melunasi tagihannya, dan kenapa itu hanya bisa terjadi pada
satu titik tertentu dalam hidup sebuah pesanan.

## Kapan pembayaran menjadi mungkin

Bukan saat memesan. Bukan pula saat kurir sedang menjemput.

Pembayaran terbuka hanya setelah petugas memeriksa barang dan menetapkan
harganya. Pada saat itu pesanan masuk ke **menunggu pelunasan** dan pelanggan
untuk pertama kalinya menerima tagihan.

Dua syarat harus terpenuhi: pesanan berada di tahap itu, **dan** totalnya lebih
besar dari nol. Pesanan yang berada di menunggu-pelunasan tanpa harga — yang bisa
terjadi sesaat — tidak bisa dibayar, dan aplikasi mengatakannya.

## Membayar

Pelanggan membuka halaman pembayaran dan meminta membayar. Aplikasi menghubungi
Midtrans, yang mengembalikan **kode QRIS**. Pelanggan memindainya dengan aplikasi
perbankan atau dompet elektronik apa pun yang mendukung QRIS.

Kode QR berlaku selama **15 menit**.

Jika mereka kembali belakangan, salah satu dari dua hal terjadi:

- **QR yang ada masih segar** → mereka menerima QR yang sama.
- **QR sudah basi** → percobaan lama ditandai kedaluwarsa dan QR baru dibuat.

Mereka tidak pernah dibiarkan menatap kode mati tanpa jalan keluar.

## Bagaimana aplikasi tahu mereka sudah membayar

Bagian inilah yang sering mengejutkan.

Aplikasi tidak mengetahui pembayaran dari peramban pelanggan. Ponsel mereka
berbicara dengan banknya, bank berbicara dengan Midtrans, dan **Midtrans
memanggil aplikasi secara langsung** pada alamat webhook khusus.

Panggilan itulah yang menandai transaksi lunas. Halaman pelanggan sedang
mengawasi kanal langsung untuk pesanan tersebut, jadi halamannya memperbarui
diri begitu webhook tiba — biasanya dalam hitungan detik.

Konsekuensi praktisnya: **jangan menganggap "pelanggan bilang sudah bayar" atau
"peramban sudah kembali" sebagai bukti.** Hanya webhook yang melunasi apa pun.
Jika Midtrans lambat, halaman akan jujur menampilkan tertunda sedikit lebih lama.

## Apa yang terjadi begitu lunas

Ketika pembayaran dikonfirmasi, pesanan langsung berpindah dari **menunggu
pelunasan** ke **dalam pencucian**. Tidak ada yang perlu menekan apa pun. Barang
masuk antrean cuci dan petugas mengambilnya dari sana.

## Ketika ada yang salah

Midtrans melaporkan beberapa hasil, dan aplikasi memetakan masing-masing:

| Yang terjadi                           | Hasilnya    |
| -------------------------------------- | ----------- |
| Pembayaran ditangkap atau diselesaikan | **Lunas**   |
| Masih diproses                         | Tertunda    |
| Ditolak atau gagal                     | Gagal       |
| Dibatalkan                             | Dibatalkan  |
| Kehabisan waktu                        | Kedaluwarsa |

Ada satu pengecualian yang disengaja. Jika Midtrans melaporkan penangkapan
sukses tetapi menandainya sebagai **tantangan penipuan**, aplikasi
memperlakukannya sebagai _tertunda_, bukan lunas. Uangnya tidak dilepaskan dan
pesanan tidak maju. Di dasbor Midtrans akan terlihat lunas sementara aplikasi
berkata sebaliknya — itu memang disengaja, dan perlu ditinjau manusia.

Jika layanan pembayaran sama sekali tidak dapat dihubungi, pelanggan menerima
pesan sederhana "layanan pembayaran sedang tidak tersedia, silakan coba lagi"
alih-alih halaman galat.

## Membayar dengan cara lain

Tidak semua pembayaran lewat QRIS. Tunai di konter, kartu, atau transfer bank
yang webhook-nya tidak pernah tiba semuanya terjadi di dunia nyata.

Untuk itu, admin menandai pesanan lunas secara manual — lihat
[admin/reconciliation](../../admin/reconciliation/). Efeknya pada pesanan
identik: pesanan pindah ke dalam-pencucian. Bedanya, pelunasan manual membawa
catatan tertulis yang menjelaskan dari mana uangnya berasal.

## Tangkapan Layar

Setiap keadaan di bawah ditampilkan pada tiga lebar — desktop (1440px), tablet (834px), dan mobile (430px). Gambar utama di atas memakai tampilan desktop, sesuai cara layar role ini biasa dipakai.

**`pending` — kode QRIS menunggu dipindai**

| Desktop                                                                                                    | Tablet                                                                                                   | Mobile                                                                                                   |
| ---------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| ![`pending` — kode QRIS menunggu dipindai — desktop](../../../assets/customer-payment-pending-desktop.png) | ![`pending` — kode QRIS menunggu dipindai — tablet](../../../assets/customer-payment-pending-tablet.png) | ![`pending` — kode QRIS menunggu dipindai — mobile](../../../assets/customer-payment-pending-mobile.png) |

**`paid` — lunas, pesanan pindah ke pencucian**

| Desktop                                                                                                     | Tablet                                                                                                    | Mobile                                                                                                    |
| ----------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| ![`paid` — lunas, pesanan pindah ke pencucian — desktop](../../../assets/customer-payment-paid-desktop.png) | ![`paid` — lunas, pesanan pindah ke pencucian — tablet](../../../assets/customer-payment-paid-tablet.png) | ![`paid` — lunas, pesanan pindah ke pencucian — mobile](../../../assets/customer-payment-paid-mobile.png) |

**`expired` — masa berlaku QR habis**

| Desktop                                                                                              | Tablet                                                                                             | Mobile                                                                                             |
| ---------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| ![`expired` — masa berlaku QR habis — desktop](../../../assets/customer-payment-expired-desktop.png) | ![`expired` — masa berlaku QR habis — tablet](../../../assets/customer-payment-expired-tablet.png) | ![`expired` — masa berlaku QR habis — mobile](../../../assets/customer-payment-expired-mobile.png) |

→ Versi satu menit: [tldr.md](tldr.md)
→ Detail implementasi: [teknis.md](teknis.md)
