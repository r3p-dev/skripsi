# Admin — User Management

The account register: customers who signed themselves up, plus staff and admin
accounts, which have no signup path of their own and can **only** be created
here.

**Code:** [`user_service.ts`](../../app/services/user_service.ts) ·
[`admin/user_controller.ts`](../../app/controllers/admin/user_controller.ts) ·
[`user_validator.ts`](../../app/validators/user_validator.ts) ·
pages under [`inertia/pages/admin/user/`](../../inertia/pages/admin/user/)

---

## 1. This is the only door to a privileged account

```ts
/**
 * This is the only way a staff or admin account comes into existence:
 * `AuthService.signup` always produces a customer, deliberately, so that the
 * public form cannot mint privileged accounts.
 */
async createUser(data: CreateUserData): Promise<User> {
  return User.create({ name: data.name, phone: data.phone, password: data.password, role: data.role })
}
```

`AuthService.signup` accepts an optional role argument but the public
`SignupController` never passes one, so it always creates a customer. The role
field exists on **this** form and nowhere else.

The very first admin comes from
[`user_seeder.ts`](../../database/seeders/user_seeder.ts) — phone
`081200000001`, password `admin12345`, idempotent on the phone number. Change it
after the first sign-in; without it a fresh database has no way into the admin
area at all.

---

## 2. Listing

```ts
private allUsersQuery(filters: Filters, role?: Role) {
  const searchTerm = `%${filters.search}%`

  return User.query()
    .if(role, (q) => q.where('role', role!))
    .if(filters.search, (q) => q.where((matches) =>
      matches.whereILike('name', searchTerm).orWhereILike('phone', searchTerm)))
    .orderBy('created_at', 'desc')
}
```

Newest first. Search covers name and phone — the two things you know when
someone asks you to find an account. The `orWhere` chain is grouped inside
`.where(...)` so the role filter cannot be broken by SQL precedence.

The page also gets:

```ts
roleCounts:     await this.userService.getRoleCounts(),        // tab counters
roleOptions:    ROLE_OPTIONS,                                  // built from the Role enum
undeletableIds: await this.userService.getUndeletableIds(users.all()),
```

`getRoleCounts` is one grouped query mapped onto the enum, so a role with zero
accounts still shows `0` rather than vanishing from the tab bar.

An unrecognised `?role=` in the query string means "all", not an empty list:

```ts
private roleFrom(query) {
  const requested = String(query.role ?? '')
  return Object.values(Role).includes(requested as Role) ? (requested as Role) : undefined
}
```

Same defensive reading as the [order monitor](order-monitor.md#3-filter-handling).

---

## 3. Creating

```ts
export const createUserValidator = vine.create({
  name:     name(),
  phone:    phone().unique({ table: 'users', column: 'phone' }),
  password: password().confirmed({ as: 'passwordConfirmation' }),
  role:     vine.enum(Object.values(Role)),
})
```

Same `name`/`phone`/`password` rules as public signup — see
[customer/account.md §1](../customer/account.md#1-the-identity-is-a-phone-number).
The account is created directly; **no invitation, no verification, no welcome
message**. The admin tells the person their password out of band, and they change
it from their own profile.

> **Why no invite flow:** the whole team is a handful of people who work in the
> same room. An email-less invitation system for that would be more moving parts
> than the problem justifies.

---

## 4. Editing, and the two things that are refused

```ts
export const updateUserValidator = vine.withMetaData<{ userId: number }>().create({
  name:     name(),
  phone:    phone().unique({
    table: 'users', column: 'phone',
    filter: (query, _value, field) => query.whereNot('id', field.meta.userId),   // exclude self
  }),
  password: password().confirmed({ as: 'passwordConfirmation' }).optional(),     // blank = leave alone
  role:     vine.enum(Object.values(Role)),
})
```

Two deliberate differences from the create validator:

- **The password is optional.** An admin fixing a misspelled name should not have
  to invent a new password for that person, and a blank field must mean "leave it
  alone", not "blank it".
- **The uniqueness check excludes this account.** Otherwise saving a form that
  never touched the phone number would be rejected as a duplicate of itself. The
  `userId` arrives through validator metadata, passed by the controller:

```ts
await request.validateUsing(updateUserValidator, { meta: { userId: id } })
```

### 4.1 An admin cannot change their own role

```ts
if (user.id === admin.id && data.role !== user.role) {
  throw E_VALIDATION_ERROR('role', 'Anda tidak dapat mengubah peran akun Anda sendiri.')
}
```

> **Why:** demoting yourself is a one-way door. The moment it saved, role
> middleware would bounce you out of the admin area — and if you were the only
> admin, the shop would be locked out of its own management console with no way
> back in short of database surgery.

The edit page receives `isSelf` so the role field is visibly locked rather than
failing on submit.

### 4.2 An admin cannot delete their own account

```ts
if (user.id === admin.id) {
  throw E_VALIDATION_ERROR('id', 'Anda tidak dapat menghapus akun Anda sendiri.')
}
```

Same reasoning, harder consequences.

⚠️ Neither rule prevents an admin deleting or demoting **another** admin. The
system does not guarantee at least one admin remains — only that you cannot be
the one who removes yourself. Two admins can, between them, lock the business
out.

---

## 5. Accounts that appear in the order record cannot be deleted

```ts
async hasHistory(user: User): Promise<boolean> {
  const [orders, actions] = await Promise.all([
    Order.query().where('user_id', user.id).count('* as total'),          // customer placed orders
    OrderAction.query().where('staff_id', user.id).count('* as total'),   // staff/admin recorded work
  ])

  return Number(orders[0].$extras.total) > 0 || Number(actions[0].$extras.total) > 0
}
```

Refused with *"Akun ini sudah memiliki riwayat pesanan dan tidak dapat dihapus."*

Both `orders.user_id` and `order_actions.staff_id` are `RESTRICT` foreign keys,
so the database would refuse regardless; the check turns a Postgres error into an
explanation.

> **Why history wins over tidiness:** the name on an order is part of the record
> of what happened. A completed order whose customer no longer exists, or a
> collection photo whose collector no longer exists, is an audit trail with a
> hole in it. In practice this means: **a customer who has ordered, and a staff
> member who has worked, are permanent.**

Note the asymmetry — this catches an admin too, as soon as they perform a
[payment override](reconciliation.md), because that writes an `order_actions` row
in their name.

### What deletion does when it is allowed

```ts
await user.related('addresses').query().delete()
await user.delete()
```

Addresses are cleared first because `addresses.user_id` is also `RESTRICT`. A
user with no orders has no order pointing at those addresses, so removing them is
safe. Everything else the user could own (`remember_me_tokens`, `notifications`)
cascades.

### Pre-computed refusals

```ts
async getUndeletableIds(users: User[]): Promise<number[]> {
  const ids = users.map((u) => u.id)

  const [orders, actions] = await Promise.all([
    Order.query().whereIn('user_id', ids).distinct('user_id').select('user_id'),
    OrderAction.query().whereIn('staff_id', ids).distinct('staff_id').select('staff_id'),
  ])

  return [...new Set([...orders.map((o) => o.userId!), ...actions.map((a) => a.staffId)])]
}
```

Two queries for the whole page instead of two per row, so the delete button is
already disabled on the accounts that cannot be removed. Same pattern as
`getInUseServiceIds` in [catalogue.md](catalogue.md).

---

## 6. Export

`GET /admin/users/export` — follows the current role tab and search:

`Nama · Telepon · Peran · Bergabung`

```ts
/**
 * The password hash is not a column and must never become one: an export is a
 * file that leaves the server, gets mailed around and sits in a downloads
 * folder, which is the last place a credential belongs.
 */
```

Worth reading twice before adding a column here. `password` is already
`serializeAs: null` on the model, so it never reaches a transformer either.

---

## 7. Where to change things

| To change…                                | Edit                                                              |
| ----------------------------------------- | ----------------------------------------------------------------- |
| Add a role                                | [`role_enum.ts`](../../app/enums/role_enum.ts) — `Role`, `RoleLabel`, **and `RoleRedirect`**, plus a route group and a layout |
| Password/phone rules                      | [`shared.ts`](../../app/validators/shared.ts)                     |
| Guarantee at least one admin survives     | Add a count check to `updateUser` and `deleteUser`                |
| Allow deleting accounts with history      | Would mean changing FKs to `SET NULL` and accepting an incomplete audit trail |
| Bootstrap admin credentials               | [`user_seeder.ts`](../../database/seeders/user_seeder.ts)         |
