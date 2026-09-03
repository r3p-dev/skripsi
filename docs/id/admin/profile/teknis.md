# Profil Admin — Teknis

## Route

Berada dalam `auth()` + `role(Role.ADMIN)`, `.prefix('admin').as('admin')`.

| Method | URL                   | Controller              | Nama route              |
| ------ | --------------------- | ----------------------- | ----------------------- |
| GET    | `/admin/profile`      | `admin.Profile.show`    | `admin.profile.show`    |
| PUT    | `/admin/profile`      | `admin.Profile.update`  | `admin.profile.update`  |
| PUT    | `/admin/password`     | `admin.Password.update` | `admin.password.update` |
| POST   | `/admin/phone`        | `admin.Phone.store`     | `admin.phone.store`     |
| GET    | `/admin/phone/verify` | `admin.Phone.update`    | `admin.phone.update`    |

`admin.profile.show` adalah sasaran `LoginRedirect` untuk `Role.ADMIN`.

## Berkas

| Bagian     | Path                                                                                                           |
| ---------- | -------------------------------------------------------------------------------------------------------------- |
| Controller | `profile_`, `password_`, `phone_controller.ts` di [app/controllers/admin/](../../../../app/controllers/admin/) |
| Service    | [app/services/profile_service.ts](../../../../app/services/profile_service.ts)                                 |
| Validator  | [app/validators/profile_validator.ts](../../../../app/validators/profile_validator.ts)                         |

## Implementasi bersama

Perilakunya identik dengan
[customer/profile](../../customer/profile/teknis.md). `ProfileService` tidak
peduli role kecuali pada:

```ts
const PHONE_VERIFICATION_ROUTE = {
  [Role.CUSTOMER]: 'customer.phone.update',
  [Role.STAFF]: 'staff.phone.update',
  [Role.ADMIN]: 'admin.phone.update',
} as const
```

Lihat halaman pelanggan untuk `changeName`, `changePassword`,
`requestChangePhone`, `verifyPhoneChange`, pembentukan URL bertanda tangan, dan
penjaga verifikasinya.

## Menyunting diri lewat manajemen pengguna

Admin juga bisa menjangkau catatannya sendiri lewat `admin.user.edit`, yang
memakai validator berbeda:

```ts
export const adminUserValidator = vine.create({
  name: name(),
  phone: phone(),
  role: vine.enum(Object.values(Role)),
  isActive: vine.boolean().optional(),
  password: password().confirmed({ as: 'passwordConfirmation' }).optional(),
})
```

`UserController.edit` mengirimkan `isSelf: account.id === admin.id` supaya UI
bisa memperingatkan. **Server tidak memblokir penyuntingan diri** atas role atau
status aktif.

### Jebakan penonaktifan

```ts
user.merge({
  name: data.name,
  phone: data.phone,
  role: data.role,
  isActive: data.isActive ?? false, // tidak ada → false
})
```

`isActive` bersifat opsional di validator tetapi bernilai bawaan **`false`**
ketika dihilangkan. Form yang tidak mengirimkan field itu menonaktifkan akunnya.
Digabung dengan diizinkannya penyuntingan diri, admin bisa menonaktifkan dirinya
sendiri.

Penghapusan diblokir, memang:

```ts
async deleteAccount(actor, id) {
  if (actor.id === id) throw E_VALIDATION_ERROR pada 'form'
    // 'Anda tidak dapat menghapus akun Anda sendiri.'
  ...
}
```

Jadi menghapus diri sendiri mustahil, tetapi menonaktifkan diri sendiri tidak.

## Perbedaan penanganan kata sandi

| Jalur                           | Efek pada kata sandi                                                                                   |
| ------------------------------- | ------------------------------------------------------------------------------------------------------ |
| `ProfileService.changePassword` | Memverifikasi kata sandi saat ini; `passwordChangedAt` dibiarkan                                       |
| `UserService.updateFromAdmin`   | Tanpa pemeriksaan kata sandi saat ini; menetapkan `passwordChangedAt = null` bila kata sandi diberikan |
| `AuthService.resetPassword`     | Mencap `passwordChangedAt`, mencabut token ingat-saya                                                  |

`updateFromAdmin` hanya menulis ulang kata sandi ketika benar-benar diketik,
sehingga menyimpan nama tidak mengatur ulang login seseorang.

## Kasus tepi

- Endpoint verifikasi memeriksa `Number(userId) !== user.id`, sehingga tautan
  yang dicetak untuk akun lain tidak bisa dituntaskan.
- Admin dan petugas berbagi `/internal/login`; hanya pengalihan setelah login
  yang berbeda.
- Mengganti telepon di sini tidak membatalkan sesi.
- Tidak ada logika profil khusus admin — ketiga role berbagi satu service.

→ Versi satu menit: [tldr.md](tldr.md)
→ Penjelasan bahasa sehari-hari: [panduan.md](panduan.md)
