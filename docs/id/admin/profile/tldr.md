# Profil Admin — TL;DR

Data akun admin sendiri. **Kode yang sama dengan profil pelanggan dan petugas** —
satu service bersama, tiga prefix URL.

![Halaman akun admin sendiri](../../../assets/admin-profile-show-desktop.png)

## Lima hal yang perlu diketahui

1. **Tiga form yang sama**: nama, kata sandi, telepon.
2. **Prefix `/admin`.** Route-nya `admin.profile.show`, `admin.password.update`,
   `admin.phone.store`, `admin.phone.update`.
3. **Penggantian telepon tetap butuh verifikasi WhatsApp** — tautan bertanda
   tangan, 15 menit, dikirim ke nomor baru.
4. **Ini halaman pendaratan setelah login** bagi admin (`admin.profile.show`),
   bukan dasbor.
5. **Untuk mengubah role-nya sendiri, admin memakai [users](../users/)** — tetapi
   mereka tidak bisa menghapus dirinya sendiri.

## Route sekilas

| Method | URL                   | Fungsi                                  |
| ------ | --------------------- | --------------------------------------- |
| GET    | `/admin/profile`      | Menampilkan profil                      |
| PUT    | `/admin/profile`      | Mengganti nama                          |
| PUT    | `/admin/password`     | Mengganti kata sandi                    |
| POST   | `/admin/phone`        | Mengajukan penggantian nomor            |
| GET    | `/admin/phone/verify` | Konfirmasi lewat tautan bertanda tangan |

## Jebakannya

**Admin yang menyunting akunnya sendiri lewat [users](../users/) adalah jalur
berbeda dengan aturan berbeda** — jalur itu bisa mengubah role dan `is_active`,
jalur ini tidak. Layar sunting pengguna mengirimkan `isSelf` supaya UI bisa
memperingatkan.

Yang menarik, `updateFromAdmin` menjadikan `isActive` bernilai `false` bila
field-nya tidak ada, sehingga admin bisa menonaktifkan dirinya sendiri lewat
layar pengguna. Menghapus diri sendiri diblokir; menonaktifkan tidak.

→ Penjelasan bahasa sehari-hari: [panduan.md](panduan.md)
→ Detail implementasi: [teknis.md](teknis.md)
