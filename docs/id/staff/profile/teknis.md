# Profil Petugas — Teknis

## Route

Berada dalam `auth()` + `role(Role.STAFF)`, `.prefix('staff').as('staff')`.

| Method | URL                   | Controller              | Nama route              |
| ------ | --------------------- | ----------------------- | ----------------------- |
| GET    | `/staff/profile`      | `staff.Profile.show`    | `staff.profile.show`    |
| PUT    | `/staff/profile`      | `staff.Profile.update`  | `staff.profile.update`  |
| PUT    | `/staff/password`     | `staff.Password.update` | `staff.password.update` |
| POST   | `/staff/phone`        | `staff.Phone.store`     | `staff.phone.store`     |
| GET    | `/staff/phone/verify` | `staff.Phone.update`    | `staff.phone.update`    |

`staff.profile.show` adalah sasaran pengalihan setelah login, dari `LoginRedirect`
di [role_enum.ts](../../../../app/enums/role_enum.ts).

## Berkas

| Bagian     | Path                                                                                                                                     |
| ---------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| Controller | `profile_controller.ts`, `password_controller.ts`, `phone_controller.ts` di [app/controllers/staff/](../../../../app/controllers/staff/) |
| Service    | [app/services/profile_service.ts](../../../../app/services/profile_service.ts)                                                           |
| Validator  | [app/validators/profile_validator.ts](../../../../app/validators/profile_validator.ts)                                                   |

Controller staff hanyalah pembungkus tipis. Seluruh logika ada di
`ProfileService` bersama.

## Service bersama, routing sadar-role

`ProfileService` tidak peduli role kecuali pada satu tabel:

```ts
const PHONE_VERIFICATION_ROUTE = {
  [Role.CUSTOMER]: 'customer.phone.update',
  [Role.STAFF]: 'staff.phone.update',
  [Role.ADMIN]: 'admin.phone.update',
} as const
```

`#createPhoneVerificationUrl` memilih dari tabel itu memakai `user.role`,
sehingga tautan bertanda tangan selalu menunjuk balik ke prefix role pemanggil.

**Konsekuensinya:** perubahan pada `ProfileService` memengaruhi ketiga role.
Tidak ada logika profil khusus petugas.

## Perilaku

Identik dengan [customer/profile](../../customer/profile/teknis.md) — lihat
halaman itu untuk rincian lengkap tentang:

- `changeName`, `changePassword` (dengan pemeriksaan `verifyPassword`),
  `requestChangePhone`, `verifyPhoneChange`
- pembentukan URL bertanda tangan dan `expiresIn: '15m'`-nya
- penjaga tiga kondisi pada endpoint verifikasi

Satu-satunya perbedaan adalah controller dan nama route yang terlibat.

## Yang sengaja tidak ada

- **Tidak ada penyuntingan role.** Validator
  `changeName`/`changePassword`/`changePhone` tidak memuat field `role`, jadi
  petugas tidak bisa menaikkan haknya. Perubahan role melalui `adminUserValidator`
  di [admin_validator.ts](../../../../app/validators/admin_validator.ts), yang
  hanya dapat dijangkau di bawah `role(Role.ADMIN)`.
- **Tidak ada sakelar `is_active`.** Penonaktifan adalah aksi admin.
- **Tidak ada akses ke pengguna lain.** Setiap handler menentukan subjek dari
  `auth.getUserOrFail()`, tidak pernah dari parameter route.

## Kasus tepi

- Endpoint verifikasi telepon memeriksa `Number(userId) !== user.id`, sehingga
  petugas tidak bisa menuntaskan tautan yang dicetak untuk akun lain sekalipun
  mereka memperolehnya.
- `changePassword` tidak mencap `passwordChangedAt` dan tidak mencabut token
  ingat-saya — itu dikhususkan untuk `AuthService.resetPassword`.
- Karena petugas dan admin berbagi `/internal/login`, petugas yang role-nya
  diubah menjadi admin tetap bisa bekerja, tetapi pengalihan setelah login-nya
  berubah pada login berikutnya.

→ Versi satu menit: [tldr.md](tldr.md)
→ Penjelasan bahasa sehari-hari: [panduan.md](panduan.md)
