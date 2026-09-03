# Pengguna — TL;DR

Manajemen akun dan role. **Hanya di sinilah akun petugas dan admin bisa dibuat** —
pendaftaran publik selalu menghasilkan pelanggan.

![Semua akun dengan jumlah per role](../../../assets/admin-users-index-desktop.png)

## Lima hal yang perlu diketahui

1. **Admin tidak bisa menghapus akunnya sendiri** — diblokir dengan pesan jelas.
2. **Akun yang punya riwayat pesanan juga tidak bisa dihapus.** Menghapusnya akan
   membuat riwayat itu yatim.
3. **`isActive` bernilai bawaan `false` ketika field-nya tidak ada** saat
   pembaruan. Form yang menghilangkannya akan menonaktifkan akun.
4. **Kata sandi hanya ditulis ulang bila benar-benar diketik**, jadi menyimpan
   nama tidak mengatur ulang login seseorang.
5. **Dua validator berbeda**: `userValidator` saat membuat, `adminUserValidator`
   saat memperbarui.

## Route sekilas

| Method   | URL                                          | Fungsi                        |
| -------- | -------------------------------------------- | ----------------------------- |
| GET      | `/admin/users`                               | Daftar, saring per role, cari |
| GET/POST | `/admin/users/create` · `/admin/users`       | Membuat                       |
| GET/PUT  | `/admin/users/:id/edit` · `/admin/users/:id` | Menyunting                    |
| DELETE   | `/admin/users/:id`                           | Menghapus (dijaga)            |

## Jebakannya

**Admin bisa menonaktifkan dirinya sendiri, meski tidak bisa menghapus dirinya
sendiri.** `updateFromAdmin` menggabungkan `isActive: data.isActive ?? false`,
dan penyuntingan diri tidak diblokir di sisi server — UI hanya menerima penanda
`isSelf` sebagai petunjuk.

Jebakan kedua: **`updateFromAdmin` menetapkan `passwordChangedAt = null`** ketika
kata sandi diberikan, kebalikan dari `AuthService.resetPassword` yang justru
mencapnya.

→ Penjelasan bahasa sehari-hari: [panduan.md](panduan.md)
→ Detail implementasi: [teknis.md](teknis.md)
