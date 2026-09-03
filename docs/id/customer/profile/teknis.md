# Profil — Teknis

## Route

Berada dalam grup `auth()` + `role(Role.CUSTOMER)`, dinamai dengan prefix
`customer.`. Lihat [start/routes.ts](../../../../start/routes.ts).

| Method | URL             | Controller                 | Nama route                 |
| ------ | --------------- | -------------------------- | -------------------------- |
| GET    | `/profile`      | `customer.Profile.show`    | `customer.profile.show`    |
| PUT    | `/profile`      | `customer.Profile.update`  | `customer.profile.update`  |
| PUT    | `/password`     | `customer.Password.update` | `customer.password.update` |
| POST   | `/phone`        | `customer.Phone.store`     | `customer.phone.store`     |
| GET    | `/phone/verify` | `customer.Phone.update`    | `customer.phone.update`    |

Petugas dan admin menyediakan set identik di bawah `/staff` dan `/admin`, dengan
controller tipis masing-masing tetapi `ProfileService` yang sama.

## Berkas

| Bagian     | Path                                                                                                   |
| ---------- | ------------------------------------------------------------------------------------------------------ |
| Controller | [app/controllers/customer/](../../../../app/controllers/customer/) — `profile_`, `password_`, `phone_` |
| Service    | [app/services/profile_service.ts](../../../../app/services/profile_service.ts)                         |
| Validator  | [app/validators/profile_validator.ts](../../../../app/validators/profile_validator.ts)                 |
| WhatsApp   | [app/notifications/whatsapp_service.ts](../../../../app/notifications/whatsapp_service.ts)             |

## Validator

```ts
changeNameValidator     { name }
changePasswordValidator { currentPassword, password (confirmed) }
changePhoneValidator    { phone }
```

Ketiganya memakai ulang `name()`, `password()`, `phone()` dari
[shared.ts](../../../../app/validators/shared.ts) — aturannya identik dengan
pendaftaran.

Perhatikan `changePasswordValidator` juga menjalankan `password()` pada
`currentPassword`, sehingga kata sandi tersimpan yang lebih tua dari aturan
sekarang akan gagal validasi sebelum `verifyPassword` sempat dipanggil.

## ProfileService

### `changeName(data, user)`

`user.merge({ name }).save()`. Tanpa pemeriksaan lanjutan.

### `changePassword(data, user)`

```ts
const ok = await user.verifyPassword(data.currentPassword)
if (!ok) throw E_VALIDATION_ERROR pada field 'currentPassword'
await user.merge({ password: data.password }).save()
```

**Tidak** menyentuh `passwordChangedAt` dan **tidak** mencabut token ingat-saya —
itu hanya terjadi di `AuthService.resetPassword`. Perbedaan yang disengaja:
penggantian sukarela tidak diperlakukan sebagai sinyal pembajakan.

### `requestChangePhone(data, user)`

1. Tolak jika `data.phone === user.phone`.
2. Tolak jika `User.findBy('phone', data.phone)` mengembalikan sesuatu.
3. Bangun URL bertanda tangan dan kirim ke **nomor baru** lewat
   `FonnteService.sendVerificationLink`.

Kedua penolakan melempar `E_VALIDATION_ERROR` pada field `phone` lewat helper
privat `#phoneValidationError`.

### URL bertanda tangan

```ts
signedUrlFor(
  PHONE_VERIFICATION_ROUTE[user.role], // customer|staff|admin .phone.update
  {},
  { qs: { phone, userId: user.id }, expiresIn: '15m', prefixUrl: appUrl }
)
```

`PHONE_VERIFICATION_ROUTE` memetakan role → nama route, itulah sebabnya satu
service melayani ketiga role.

### `verifyPhoneChange(phone, user)`

- Kembali diam-diam jika `phone === user.phone` (pemutaran ulang idempoten).
- Memeriksa ulang keunikan dengan mengecualikan user saat ini, lalu menyimpan.

## Endpoint verifikasi

`Phone.update` menjaga tiga kondisi sebelum mendelegasikan:

```ts
if (!request.hasValidSignature() || !phone || Number(userId) !== user.id) {
  return inertia.render('errors/invalid_signature', {})
}
```

Jadi tautan gagal secara tertutup ketika diutak-atik, kedaluwarsa, kehilangan
parameter `phone`, atau dibuka saat terautentikasi sebagai pengguna lain.

## Kasus tepi

- **Nomor tidak dipesan selama jendela 15 menit.** Keunikan diperiksa saat
  permintaan _dan_ saat verifikasi. Dua permintaan bersamaan untuk nomor sama
  sama-sama mengirim tautan; klik kedua gagal.
- **Nomor salah ketik mengirim tautan ke pihak ketiga** dan tidak menghasilkan
  galat — jalur permintaan hanya memvalidasi format dan ketersediaan, bukan
  kepemilikan.
- **`users.phone` bersifat `unique` di tingkat basis data**, jadi seandainya
  kedua pemeriksaan dilewati pun, penyisipan akan gagal dengan `23505`.
- **Mengganti telepon tidak membatalkan sesi.** Pengguna tetap masuk dengan
  nomor baru.
- Route verifikasi memakai `GET`, jadi aman dibuka ulang; kunjungan kedua
  mengenai early return `phone === user.phone`.

→ Versi satu menit: [tldr.md](tldr.md)
→ Penjelasan bahasa sehari-hari: [panduan.md](panduan.md)
