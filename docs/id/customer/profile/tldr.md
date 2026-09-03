# Profil — TL;DR

Data akun pelanggan sendiri: **nama, nomor telepon, kata sandi**. Tiga form
terpisah dalam satu halaman, masing-masing dengan aturannya sendiri.

![Halaman profil — baris nama, telepon, dan kata sandi](../../../assets/customer-profile-show-desktop.png)

## Lima hal yang perlu diketahui

1. **Nama dan kata sandi berubah seketika.** Kirim form, langsung tersimpan.
2. **Nomor telepon tidak.** Mengganti nomor menuntut klik tautan verifikasi yang
   dikirim lewat WhatsApp ke nomor _baru_.
3. **Tautan itu URL bertanda tangan dan kedaluwarsa dalam 15 menit.** Ini
   membuktikan orangnya memang menguasai nomor baru sebelum akun dipindahkan.
4. **Mengganti kata sandi menuntut kata sandi saat ini.** Kata sandi lama yang
   salah gagal pada field `currentPassword`, bukan galat umum.
5. **Ketiga role memakai satu service.** `ProfileService` melayani customer,
   staff, dan admin secara identik — hanya route pengalihannya yang berbeda.

## Route sekilas

| Method | URL             | Fungsi                                     |
| ------ | --------------- | ------------------------------------------ |
| GET    | `/profile`      | Menampilkan halaman profil                 |
| PUT    | `/profile`      | Mengganti nama                             |
| PUT    | `/password`     | Mengganti kata sandi                       |
| POST   | `/phone`        | Mengajukan penggantian nomor               |
| GET    | `/phone/verify` | Mengonfirmasi lewat tautan bertanda tangan |

## Jebakannya

**Tautan verifikasi dikirim ke nomor baru, bukan nomor saat ini.** Jika
pelanggan salah ketik nomor, tautannya terkirim ke orang asing dan mereka tidak
pernah menerimanya. Tidak ada yang memberi tahu bahwa tautan itu nyasar —
permintaannya tampak berhasil. Mereka harus mengajukan ulang dengan nomor benar.

Selain itu: nomor baru **tidak** dipesan saat permintaan dibuat. Keunikan
diperiksa ulang saat tautan dibuka, jadi jika dua orang berebut nomor yang sama,
yang kedua gagal pada tahap verifikasi.

→ Penjelasan bahasa sehari-hari: [panduan.md](panduan.md)
→ Detail implementasi: [teknis.md](teknis.md)
