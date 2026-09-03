# Autentikasi — Teknis

## Route

Semua route ini berada dalam grup middleware `guest()` kecuali logout, yang
menuntut `auth()`. Didefinisikan di [start/routes.ts](../../../../start/routes.ts).

| Method | URL                | Controller                    | Limiter                 |
| ------ | ------------------ | ----------------------------- | ----------------------- |
| GET    | `/signup`          | `auth.Signup.create`          | —                       |
| POST   | `/signup`          | `auth.Signup.store`           | `signupLimiter`         |
| GET    | `/login`           | `auth.Session.create`         | —                       |
| GET    | `/internal/login`  | `auth.Session.createInternal` | —                       |
| POST   | `/login`           | `auth.Session.store`          | `loginLimiter`          |
| GET    | `/forgot-password` | `auth.PasswordReset.create`   | —                       |
| POST   | `/forgot-password` | `auth.PasswordReset.store`    | `forgotPasswordLimiter` |
| GET    | `/reset-password`  | `auth.PasswordReset.edit`     | —                       |
| POST   | `/reset-password`  | `auth.PasswordReset.update`   | `resetPasswordLimiter`  |
| POST   | `/logout`          | `auth.Session.destroy`        | — (`auth()`)            |

## Berkas

| Bagian         | Path                                                                             |
| -------------- | -------------------------------------------------------------------------------- |
| Controller     | [app/controllers/auth/](../../../../app/controllers/auth/)                       |
| Service        | [app/services/auth_service.ts](../../../../app/services/auth_service.ts)         |
| Validator      | [app/validators/auth_validator.ts](../../../../app/validators/auth_validator.ts) |
| Aturan bersama | [app/validators/shared.ts](../../../../app/validators/shared.ts)                 |
| Limiter        | [start/limiter.ts](../../../../start/limiter.ts)                                 |
| Enum role      | [app/enums/role_enum.ts](../../../../app/enums/role_enum.ts)                     |

## Aturan validasi

Dari `auth_validator.ts`, disusun dari `shared.ts`:

```ts
name() // string, trim, 1–50, alpha + spasi + tanda hubung
phone() // phoneRule({ countryCode: 'ID' }) — dinormalkan ke E.164
password() // string, trim, 8–16, /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,16}$/
```

| Validator                 | Field                              | Catatan                                                                                                                         |
| ------------------------- | ---------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| `loginValidator`          | `phone`, `password`, `rememberMe?` | —                                                                                                                               |
| `signupValidator`         | `name`, `phone`, `password`        | `phone` memakai `.unique({ table: 'users', column: 'phone' })`; `password` memakai `.confirmed({ as: 'passwordConfirmation' })` |
| `forgotPasswordValidator` | `phone`                            | —                                                                                                                               |
| `resetPasswordValidator`  | `password`                         | `.confirmed()`                                                                                                                  |

Regex kata sandi bersifat daftar-putih: `[A-Za-z\d]{8,16}` dengan lookahead yang
mewajibkan minimal satu huruf dan satu angka. **Simbol gagal validasi**, dan ini
sumber laporan bug yang membingungkan.

## Model data

`users` ([migrasi](../../../../database/migrations/1761885935168_create_users_table.ts)):

| Kolom                 | Tipe      | Catatan                                     |
| --------------------- | --------- | ------------------------------------------- |
| `phone`               | string    | **unik** — identitas login                  |
| `password`            | string    | di-hash oleh mixin `AuthFinder` milik Lucid |
| `role`                | string    | terindeks; `customer` \| `staff` \| `admin` |
| `is_active`           | boolean   | terindeks, default `true`                   |
| `password_changed_at` | timestamp | nullable; dicap saat atur ulang             |

`name` dan `phone` juga punya indeks trigram GIN (`users_name_trgm_index`,
`users_phone_trgm_index`) supaya pemilih pelanggan di sisi petugas bisa
melakukan `ILIKE '%term%'` tanpa pemindaian sekuensial.

Token ingat-saya ada di `remember_me_tokens`, dengan cascade saat user dihapus.

## Penanganan role

`signup` selalu membuat `Role.CUSTOMER` — role tidak pernah diambil dari input
pengguna. Akun petugas dan admin hanya dibuat oleh admin lewat
[admin/users](../../admin/users/).

Pengalihan setelah login digerakkan tabel:

```ts
export const LoginRedirect = {
  [Role.CUSTOMER]: 'customer.profile.show',
  [Role.STAFF]: 'staff.profile.show',
  [Role.ADMIN]: 'admin.profile.show',
}
```

`/internal/login` dan `/login` sama-sama POST ke `auth.Session.store`; hanya
halaman yang dirender berbeda. Tidak ada pembatasan di sisi server yang mencegah
pelanggan masuk lewat halaman internal — pemisahannya bersifat tampilan.

## Atur ulang kata sandi

1. `PasswordReset.store` mencari user berdasarkan telepon dan mengirim tautan
   atur ulang lewat WhatsApp melalui `FonnteService`.
2. `PasswordReset.update` memvalidasi kata sandi baru, lalu
   `AuthService.resetPassword`:
   - menggabungkan `password` dan `passwordChangedAt: DateTime.now()`
   - memanggil `#revokeRememberMeTokens(user)`

`#revokeRememberMeTokens` melakukan iterasi `User.rememberMeTokens.all(user)` dan
menghapus satu per satu. Ini perulangan sekuensial yang sengaja dibiarkan — satu
pengguna hanya memegang sedikit token, dan memparalelkan penulisan di sini
berisiko memunculkan peringatan concurrent-query dari pg tanpa manfaat berarti.

## Pembatasan laju

Didefinisikan di [start/limiter.ts](../../../../start/limiter.ts). Setiap limiter
melempar `E_VALIDATION_ERROR` pada field `form`, sehingga pesannya muncul inline
alih-alih sebagai halaman 429.

| Limiter                 | Kuota      | Blokir | Kunci                       |
| ----------------------- | ---------- | ------ | --------------------------- |
| `signupLimiter`         | 10 / 1 mnt | 10 mnt | `signup:{ip}`               |
| `loginLimiter`          | 5 / 1 mnt  | 5 mnt  | `login:{ip}:{phone}`        |
| `forgotPasswordLimiter` | 1 / 15 mnt | 15 mnt | `forgot-password:{ip}`      |
| `resetPasswordLimiter`  | 5 / 15 mnt | 15 mnt | `reset-password:{ip}:{url}` |

Penghitung disimpan di tabel `rate_limits` (`key` primary, `expire` terindeks).
Mengosongkan tabel itu mengatur ulang semua batas — berguna saat pengembangan.

## Kasus tepi

- **Middleware guest** membungkus daftar/login/atur-ulang. Pengguna yang sudah
  terautentikasi dan membuka route itu akan dialihkan, jadi "masuk sebagai orang
  lain" menuntut logout eksplisit lebih dulu.
- **Limiter login memakai kunci IP + telepon.** Menyerang satu akun tidak
  mengunci akun lain dari IP yang sama, tetapi artinya penyerang yang memutar
  nomor telepon dari satu IP mendapat kuota baru tiap kali. Limiter pendaftaran
  hanya memakai IP dan menutup celah arah itu.
- **`is_active`** ada di record user dan terindeks, tetapi pendaftaran selalu
  memakai default `true`. Penonaktifan adalah aksi admin.
- **Tidak ada email di mana pun.** Apa pun yang mengharapkan kolom email tidak
  akan menemukannya.

→ Versi satu menit: [tldr.md](tldr.md)
→ Penjelasan bahasa sehari-hari: [panduan.md](panduan.md)
