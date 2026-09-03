# Profil Petugas — TL;DR

Data akun petugas sendiri. **Secara fungsi identik dengan profil pelanggan dan
admin** — service sama, aturan sama, hanya prefix URL yang berbeda.

![Halaman akun petugas sendiri](../../../assets/staff-profile-show-mobile.png)

## Lima hal yang perlu diketahui

1. **Tiga form yang sama** seperti role lain: nama, kata sandi, telepon.
2. **Prefix `/staff`.** Route-nya `staff.profile.show`, `staff.password.update`,
   `staff.phone.store`, `staff.phone.update`.
3. **Penggantian telepon tetap butuh verifikasi WhatsApp** — tautan bertanda
   tangan berlaku 15 menit, dikirim ke nomor baru.
4. **Petugas tidak bisa mengubah role-nya sendiri.** Hanya admin yang bisa,
   lewat [admin/users](../../admin/users/).
5. **Ke sinilah petugas mendarat setelah login** (`staff.profile.show`), bukan ke
   antrean tugas.

## Route sekilas

| Method | URL                   | Fungsi                                  |
| ------ | --------------------- | --------------------------------------- |
| GET    | `/staff/profile`      | Menampilkan profil                      |
| PUT    | `/staff/profile`      | Mengganti nama                          |
| PUT    | `/staff/password`     | Mengganti kata sandi                    |
| POST   | `/staff/phone`        | Mengajukan penggantian nomor            |
| GET    | `/staff/phone/verify` | Konfirmasi lewat tautan bertanda tangan |

## Jebakannya

**Satu `ProfileService` melayani ketiga role.** Bagian yang spesifik per role
hanyalah tabel pencarian:

```ts
PHONE_VERIFICATION_ROUTE = {
  customer: 'customer.phone.update',
  staff: 'staff.phone.update',
  admin: 'admin.phone.update',
}
```

Jadi perubahan pada perilaku profil ikut memengaruhi pelanggan dan admin. Jangan
memperlakukan controller staff sebagai salinan pribadi.

→ Penjelasan bahasa sehari-hari: [panduan.md](panduan.md)
→ Detail implementasi: [teknis.md](teknis.md)
→ Detail lengkap yang dibagi dengan versi pelanggan: [customer/profile](../../customer/profile/)
