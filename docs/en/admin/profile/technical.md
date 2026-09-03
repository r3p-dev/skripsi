# Admin Profile — Technical

## Routes

Inside `auth()` + `role(Role.ADMIN)`, `.prefix('admin').as('admin')`.

| Method | URL                   | Controller              | Route name              |
| ------ | --------------------- | ----------------------- | ----------------------- |
| GET    | `/admin/profile`      | `admin.Profile.show`    | `admin.profile.show`    |
| PUT    | `/admin/profile`      | `admin.Profile.update`  | `admin.profile.update`  |
| PUT    | `/admin/password`     | `admin.Password.update` | `admin.password.update` |
| POST   | `/admin/phone`        | `admin.Phone.store`     | `admin.phone.store`     |
| GET    | `/admin/phone/verify` | `admin.Phone.update`    | `admin.phone.update`    |

`admin.profile.show` is the `LoginRedirect` target for `Role.ADMIN`.

## Files

| Concern     | Path                                                                                                           |
| ----------- | -------------------------------------------------------------------------------------------------------------- |
| Controllers | `profile_`, `password_`, `phone_controller.ts` in [app/controllers/admin/](../../../../app/controllers/admin/) |
| Service     | [app/services/profile_service.ts](../../../../app/services/profile_service.ts)                                 |
| Validators  | [app/validators/profile_validator.ts](../../../../app/validators/profile_validator.ts)                         |

## Shared implementation

Behaviour is identical to
[customer/profile](../../customer/profile/technical.md). `ProfileService` is
role-agnostic apart from:

```ts
const PHONE_VERIFICATION_ROUTE = {
  [Role.CUSTOMER]: 'customer.phone.update',
  [Role.STAFF]: 'staff.phone.update',
  [Role.ADMIN]: 'admin.phone.update',
} as const
```

See the customer page for `changeName`, `changePassword`, `requestChangePhone`,
`verifyPhoneChange`, the signed-URL construction, and the verification guard.

## Self-edit through user management

An admin can also reach their own record via `admin.user.edit`, which uses a
different validator:

```ts
export const adminUserValidator = vine.create({
  name: name(),
  phone: phone(),
  role: vine.enum(Object.values(Role)),
  isActive: vine.boolean().optional(),
  password: password().confirmed({ as: 'passwordConfirmation' }).optional(),
})
```

`UserController.edit` passes `isSelf: account.id === admin.id` so the UI can
warn. **The server does not block a self-edit** of role or active status.

### The deactivation trap

```ts
user.merge({
  name: data.name,
  phone: data.phone,
  role: data.role,
  isActive: data.isActive ?? false, // absent → false
})
```

`isActive` is optional in the validator but defaults to **`false`** when
omitted. A form that does not submit the field deactivates the account. Combined
with self-edit being permitted, an admin can deactivate themselves.

Deletion is blocked, though:

```ts
async deleteAccount(actor, id) {
  if (actor.id === id) throw E_VALIDATION_ERROR on 'form'
    // 'Anda tidak dapat menghapus akun Anda sendiri.'
  ...
}
```

So self-deletion is impossible, but self-deactivation is not.

## Password handling difference

| Path                            | Effect on password                                                                     |
| ------------------------------- | -------------------------------------------------------------------------------------- |
| `ProfileService.changePassword` | Verifies current password; leaves `passwordChangedAt` untouched                        |
| `UserService.updateFromAdmin`   | No current-password check; sets `passwordChangedAt = null` when a password is supplied |
| `AuthService.resetPassword`     | Stamps `passwordChangedAt`, revokes remember-me tokens                                 |

`updateFromAdmin` only rewrites the password when one was actually typed, so
saving a name does not reset someone's login.

## Edge cases

- The verification endpoint checks `Number(userId) !== user.id`, so a link
  minted for another account cannot be completed.
- Admin and staff share `/internal/login`; only the post-login redirect differs.
- Changing a phone here does not invalidate sessions.
- There is no admin-only profile logic — all three roles share one service.

→ One-minute version: [tldr.md](tldr.md)
→ Plain-language walkthrough: [guide.md](guide.md)
