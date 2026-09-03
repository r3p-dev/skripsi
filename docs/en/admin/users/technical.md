# Users — Technical

## Routes

| Method | URL                     | Controller           | Route name           |
| ------ | ----------------------- | -------------------- | -------------------- |
| GET    | `/admin/users`          | `admin.User.index`   | `admin.user.index`   |
| GET    | `/admin/users/create`   | `admin.User.create`  | `admin.user.create`  |
| POST   | `/admin/users`          | `admin.User.store`   | `admin.user.store`   |
| GET    | `/admin/users/:id/edit` | `admin.User.edit`    | `admin.user.edit`    |
| PUT    | `/admin/users/:id`      | `admin.User.update`  | `admin.user.update`  |
| DELETE | `/admin/users/:id`      | `admin.User.destroy` | `admin.user.destroy` |

## Files

| Concern    | Path                                                                                                                                   |
| ---------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| Controller | [app/controllers/admin/user_controller.ts](../../../../app/controllers/admin/user_controller.ts)                                       |
| Service    | [app/services/user_service.ts](../../../../app/services/user_service.ts)                                                               |
| Validators | [user_validator.ts](../../../../app/validators/user_validator.ts), [admin_validator.ts](../../../../app/validators/admin_validator.ts) |

## Two validators

`store` uses `userValidator`; `update` uses `adminUserValidator`:

```ts
export const adminUserValidator = vine.create({
  name: name(),
  phone: phone(),
  role: vine.enum(Object.values(Role)),
  isActive: vine.boolean().optional(),
  password: password().confirmed({ as: 'passwordConfirmation' }).optional(),
})
```

`password` is **optional** on update, and `isActive` is optional — which drives
the default described below.

## Listing

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

Served by the trigram GIN indexes `users_name_trgm_index` and
`users_phone_trgm_index`.

`roleCounts()` is one grouped query; `undeletableIds()` is one batched
`distinct` over `orders`:

```ts
const rows = await db.from('orders').whereIn('user_id', ids).distinct('user_id')
```

Both avoid per-row queries on the list page.

## Updating

```ts
async updateFromAdmin(id: number, data: AdminUserData): Promise<User> {
  const user = await User.findOrFail(id)

  user.merge({
    name: data.name,
    phone: data.phone,
    role: data.role,
    isActive: data.isActive ?? false,     // absent → false
  })

  if (data.password) {
    user.password = data.password
    user.passwordChangedAt = null
  }

  await user.save()
  return user
}
```

Three things worth flagging:

1. **`isActive: data.isActive ?? false`.** Since the validator makes the field
   optional, a payload without it **deactivates** the account.
2. **The password is only touched when supplied**, so a name edit does not reset
   a login.
3. **`passwordChangedAt` is set to `null`**, the inverse of
   `AuthService.resetPassword` which stamps `DateTime.now()`. Remember-me tokens
   are **not** revoked here.

Phone uniqueness is not re-validated in `adminUserValidator` (unlike
`signupValidator`'s `.unique()`), so a collision surfaces as a `23505` from the
unique index rather than a field error.

## Deleting

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

Both guards raise on `form`. The order check is backed by
`orders.user_id → users` being `ON DELETE RESTRICT`, so the database refuses too.

Other FKs behave differently: `order_actions.user_id` and `orders.claimed_by` are
`ON DELETE SET NULL`, and `remember_me_tokens.tokenable_id` is `CASCADE`. So a
deletable account's action history survives with a null actor.

## Self-edit

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

`isSelf` is passed to the view but **the server does not block self-edits** of
role or `isActive`. Combined with the `?? false` default, an admin can deactivate
themselves — while self-_deletion_ is blocked outright.

## Role creation boundary

`signup` hardcodes `Role.CUSTOMER`. `adminUserValidator` is the only validator
accepting a `role`, and it is only reachable under `role(Role.ADMIN)`. This
screen is therefore the sole path to staff/admin privileges.

## Edge cases

- **Self-deactivation is possible; self-deletion is not.**
- **An admin changing another user's phone bypasses WhatsApp verification** that
  the self-service flow requires.
- **`passwordChangedAt = null`** on admin password change, and no token
  revocation.
- **Phone collisions surface as `23505`**, not a field-level validation error.
- **Most real accounts are undeletable** because of order history —
  deactivation is the practical retirement path.

→ One-minute version: [tldr.md](tldr.md)
→ Plain-language walkthrough: [guide.md](guide.md)
