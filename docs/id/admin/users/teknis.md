# Pengguna — Teknis

## Route

| Method | URL                     | Controller           | Nama route           |
| ------ | ----------------------- | -------------------- | -------------------- |
| GET    | `/admin/users`          | `admin.User.index`   | `admin.user.index`   |
| GET    | `/admin/users/create`   | `admin.User.create`  | `admin.user.create`  |
| POST   | `/admin/users`          | `admin.User.store`   | `admin.user.store`   |
| GET    | `/admin/users/:id/edit` | `admin.User.edit`    | `admin.user.edit`    |
| PUT    | `/admin/users/:id`      | `admin.User.update`  | `admin.user.update`  |
| DELETE | `/admin/users/:id`      | `admin.User.destroy` | `admin.user.destroy` |

## Berkas

| Bagian     | Path                                                                                                                                   |
| ---------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| Controller | [app/controllers/admin/user_controller.ts](../../../../app/controllers/admin/user_controller.ts)                                       |
| Service    | [app/services/user_service.ts](../../../../app/services/user_service.ts)                                                               |
| Validator  | [user_validator.ts](../../../../app/validators/user_validator.ts), [admin_validator.ts](../../../../app/validators/admin_validator.ts) |

## Dua validator

`store` memakai `userValidator`; `update` memakai `adminUserValidator`:

```ts
export const adminUserValidator = vine.create({
  name: name(),
  phone: phone(),
  role: vine.enum(Object.values(Role)),
  isActive: vine.boolean().optional(),
  password: password().confirmed({ as: 'passwordConfirmation' }).optional(),
})
```

`password` bersifat **opsional** saat pembaruan, dan `isActive` juga opsional —
itulah yang memicu nilai bawaan yang dijelaskan di bawah.

## Pendaftaran

```ts
async list(filters: UserFilters) {
  const query = User.query().orderBy('created_at', 'desc')

  if (filters.role) query.where('role', filters.role)

  if (filters.search) {
    query.where((builder) => {
      builder
        .whereILike('name', `%${filters.search}%`)
        .orWhereILike('phone', `%${filters.search}%`)
    })
  }

  return query.paginate(filters.page, 10)
}
```

Dilayani indeks trigram GIN `users_name_trgm_index` dan `users_phone_trgm_index`.

`roleCounts()` adalah satu kueri berkelompok; `undeletableIds()` adalah satu
`distinct` berkelompok atas `orders`:

```ts
const rows = await db.from('orders').whereIn('user_id', ids).distinct('user_id')
```

Keduanya menghindari kueri per baris di halaman daftar.

## Memperbarui

```ts
async updateFromAdmin(id: number, data: AdminUserData): Promise<User> {
  const user = await User.findOrFail(id)

  user.merge({
    name: data.name,
    phone: data.phone,
    role: data.role,
    isActive: data.isActive ?? false,     // tidak ada → false
  })

  if (data.password) {
    user.password = data.password
    user.passwordChangedAt = null
  }

  await user.save()
  return user
}
```

Tiga hal yang layak ditandai:

1. **`isActive: data.isActive ?? false`.** Karena validator membuat field itu
   opsional, muatan tanpa field tersebut akan **menonaktifkan** akunnya.
2. **Kata sandi hanya disentuh bila diberikan**, jadi menyunting nama tidak
   mengatur ulang login.
3. **`passwordChangedAt` ditetapkan `null`**, kebalikan dari
   `AuthService.resetPassword` yang mencap `DateTime.now()`. Token ingat-saya
   **tidak** dicabut di sini.

Keunikan telepon tidak divalidasi ulang di `adminUserValidator` (berbeda dari
`.unique()` milik `signupValidator`), jadi tabrakan muncul sebagai `23505` dari
indeks unik, bukan sebagai galat field.

## Menghapus

```ts
async deleteAccount(actor: User, id: number): Promise<void> {
  if (actor.id === id) {
    throw new vineErrors.E_VALIDATION_ERROR([
      { field: 'form', message: 'Anda tidak dapat menghapus akun Anda sendiri.' },
    ])
  }

  const user = await User.findOrFail(id)
  const orders = await Order.query().where('user_id', user.id).count('* as total')

  if (Number(orders[0].$extras.total) > 0) {
    throw new vineErrors.E_VALIDATION_ERROR([
      { field: 'form', message: 'Akun ini memiliki riwayat pesanan dan tidak dapat dihapus.' },
    ])
  }

  await user.delete()
}
```

Kedua penjaga melempar pada `form`. Pemeriksaan pesanan didukung oleh
`orders.user_id → users` yang bersifat `ON DELETE RESTRICT`, jadi basis data pun
menolak.

FK lain berperilaku berbeda: `order_actions.user_id` dan `orders.claimed_by`
bersifat `ON DELETE SET NULL`, dan `remember_me_tokens.tokenable_id` bersifat
`CASCADE`. Jadi riwayat aksi milik akun yang bisa dihapus tetap bertahan dengan
pelaku bernilai null.

## Menyunting diri sendiri

```ts
async edit({ auth, inertia, params }) {
  const admin = auth.getUserOrFail()
  const account = await this.userService.findUserOrFail(params.id)

  return inertia.render('admin/user/edit', {
    account: UserTransformer.transform(account),
    roleOptions: this.userService.roleOptions(),
    isSelf: account.id === admin.id,
  })
}
```

`isSelf` diteruskan ke tampilan tetapi **server tidak memblokir penyuntingan
diri** atas role atau `isActive`. Digabung dengan nilai bawaan `?? false`, admin
bisa menonaktifkan dirinya sendiri — sementara _penghapusan_ diri diblokir tegas.

## Batas pembuatan role

`signup` menuliskan `Role.CUSTOMER` secara mati. `adminUserValidator` adalah
satu-satunya validator yang menerima `role`, dan ia hanya dapat dijangkau di
bawah `role(Role.ADMIN)`. Karena itu layar ini adalah satu-satunya jalan menuju
hak petugas/admin.

## Kasus tepi

- **Menonaktifkan diri sendiri mungkin; menghapus diri sendiri tidak.**
- **Admin yang mengganti telepon pengguna lain melewati verifikasi WhatsApp**
  yang dituntut alur mandiri.
- **`passwordChangedAt = null`** saat admin mengganti kata sandi, dan tanpa
  pencabutan token.
- **Tabrakan telepon muncul sebagai `23505`**, bukan galat validasi tingkat
  field.
- **Sebagian besar akun sungguhan tidak bisa dihapus** karena riwayat pesanan —
  penonaktifan adalah jalur pemensiunan yang praktis.

→ Versi satu menit: [tldr.md](tldr.md)
→ Penjelasan bahasa sehari-hari: [panduan.md](panduan.md)
