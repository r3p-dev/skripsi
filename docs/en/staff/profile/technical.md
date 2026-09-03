# Staff Profile — Technical

## Routes

Inside `auth()` + `role(Role.STAFF)`, `.prefix('staff').as('staff')`.

| Method | URL                   | Controller              | Route name              |
| ------ | --------------------- | ----------------------- | ----------------------- |
| GET    | `/staff/profile`      | `staff.Profile.show`    | `staff.profile.show`    |
| PUT    | `/staff/profile`      | `staff.Profile.update`  | `staff.profile.update`  |
| PUT    | `/staff/password`     | `staff.Password.update` | `staff.password.update` |
| POST   | `/staff/phone`        | `staff.Phone.store`     | `staff.phone.store`     |
| GET    | `/staff/phone/verify` | `staff.Phone.update`    | `staff.phone.update`    |

`staff.profile.show` is the post-login redirect target, from `LoginRedirect` in
[role_enum.ts](../../../../app/enums/role_enum.ts).

## Files

| Concern     | Path                                                                                                                                     |
| ----------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| Controllers | `profile_controller.ts`, `password_controller.ts`, `phone_controller.ts` in [app/controllers/staff/](../../../../app/controllers/staff/) |
| Service     | [app/services/profile_service.ts](../../../../app/services/profile_service.ts)                                                           |
| Validators  | [app/validators/profile_validator.ts](../../../../app/validators/profile_validator.ts)                                                   |

The staff controllers are thin wrappers. All logic is in the shared
`ProfileService`.

## Shared service, role-aware routing

`ProfileService` is role-agnostic except for one table:

```ts
const PHONE_VERIFICATION_ROUTE = {
  [Role.CUSTOMER]: 'customer.phone.update',
  [Role.STAFF]: 'staff.phone.update',
  [Role.ADMIN]: 'admin.phone.update',
} as const
```

`#createPhoneVerificationUrl` selects from it with `user.role`, so the signed
link always points back to the caller's own role prefix.

**Consequence:** changes to `ProfileService` affect all three roles. There is no
staff-specific profile logic.

## Behaviour

Identical to [customer/profile](../../customer/profile/technical.md) — see that
page for the full breakdown of:

- `changeName`, `changePassword` (with `verifyPassword` check), `requestChangePhone`,
  `verifyPhoneChange`
- the signed-URL construction and its `expiresIn: '15m'`
- the three-condition guard in the verification endpoint

The only difference is which controller and route names are involved.

## What is deliberately absent

- **No role editing.** `changeName`/`changePassword`/`changePhone` validators
  contain no `role` field, so a staff member cannot escalate. Role changes go
  through `adminUserValidator` in
  [admin_validator.ts](../../../../app/validators/admin_validator.ts), reachable
  only under `role(Role.ADMIN)`.
- **No `is_active` toggle.** Deactivation is an admin action.
- **No access to other users.** Every handler resolves the subject from
  `auth.getUserOrFail()`, never from a route parameter.

## Edge cases

- The phone verification endpoint checks `Number(userId) !== user.id`, so a
  staff member cannot complete a link minted for a different account even if
  they obtain it.
- `changePassword` does not stamp `passwordChangedAt` nor revoke remember-me
  tokens — that is reserved for `AuthService.resetPassword`.
- Because staff and admin share `/internal/login`, a staff member whose role is
  changed to admin keeps working but their post-login redirect changes on next
  login.

→ One-minute version: [tldr.md](tldr.md)
→ Plain-language walkthrough: [guide.md](guide.md)
