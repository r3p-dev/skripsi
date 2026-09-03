# Profile — Technical

## Routes

Inside the `auth()` + `role(Role.CUSTOMER)` group, named with the `customer.`
prefix. See [start/routes.ts](../../../../start/routes.ts).

| Method | URL             | Controller                 | Route name                 |
| ------ | --------------- | -------------------------- | -------------------------- |
| GET    | `/profile`      | `customer.Profile.show`    | `customer.profile.show`    |
| PUT    | `/profile`      | `customer.Profile.update`  | `customer.profile.update`  |
| PUT    | `/password`     | `customer.Password.update` | `customer.password.update` |
| POST   | `/phone`        | `customer.Phone.store`     | `customer.phone.store`     |
| GET    | `/phone/verify` | `customer.Phone.update`    | `customer.phone.update`    |

Staff and admin expose the identical set under `/staff` and `/admin`, wired to
their own thin controllers but the same `ProfileService`.

## Files

| Concern     | Path                                                                                                   |
| ----------- | ------------------------------------------------------------------------------------------------------ |
| Controllers | [app/controllers/customer/](../../../../app/controllers/customer/) — `profile_`, `password_`, `phone_` |
| Service     | [app/services/profile_service.ts](../../../../app/services/profile_service.ts)                         |
| Validators  | [app/validators/profile_validator.ts](../../../../app/validators/profile_validator.ts)                 |
| WhatsApp    | [app/notifications/whatsapp_service.ts](../../../../app/notifications/whatsapp_service.ts)             |

## Validators

```ts
changeNameValidator     { name }
changePasswordValidator { currentPassword, password (confirmed) }
changePhoneValidator    { phone }
```

All three reuse `name()`, `password()`, `phone()` from
[shared.ts](../../../../app/validators/shared.ts) — identical rules to signup.

Note `changePasswordValidator` runs `password()` over `currentPassword` too, so
a stored password that predates the current rule would fail validation before
`verifyPassword` is ever reached.

## ProfileService

### `changeName(data, user)`

`user.merge({ name }).save()`. No further checks.

### `changePassword(data, user)`

```ts
const ok = await user.verifyPassword(data.currentPassword)
if (!ok) throw E_VALIDATION_ERROR on field 'currentPassword'
await user.merge({ password: data.password }).save()
```

Does **not** touch `passwordChangedAt` and does **not** revoke remember-me
tokens — that only happens in `AuthService.resetPassword`. A deliberate
difference: a voluntary change is not treated as a compromise signal.

### `requestChangePhone(data, user)`

1. Reject if `data.phone === user.phone`.
2. Reject if `User.findBy('phone', data.phone)` returns anything.
3. Build a signed URL and send it to **the new number** via
   `FonnteService.sendVerificationLink`.

Both rejections raise `E_VALIDATION_ERROR` on the `phone` field via the private
`#phoneValidationError` helper.

### The signed URL

```ts
signedUrlFor(
  PHONE_VERIFICATION_ROUTE[user.role], // customer|staff|admin .phone.update
  {},
  { qs: { phone, userId: user.id }, expiresIn: '15m', prefixUrl: appUrl }
)
```

`PHONE_VERIFICATION_ROUTE` maps role → route name, which is why one service
serves all three roles.

### `verifyPhoneChange(phone, user)`

- Returns silently if `phone === user.phone` (idempotent replay).
- Re-checks uniqueness excluding the current user, then saves.

## Verification endpoint

`Phone.update` guards on three conditions before delegating:

```ts
if (!request.hasValidSignature() || !phone || Number(userId) !== user.id) {
  return inertia.render('errors/invalid_signature', {})
}
```

So the link fails closed when it is tampered with, expired, missing the `phone`
query param, or opened while authenticated as a different user.

## Edge cases

- **The number is not reserved during the 15-minute window.** Uniqueness is
  checked at request time _and_ again at verification time. Two concurrent
  requests for the same number both send a link; the second click fails.
- **A mistyped number sends the link to a third party** and produces no error —
  the request path only validates format and availability, not ownership.
- **`users.phone` is `unique` at the database level**, so even if both checks
  were bypassed the insert would fail with `23505`.
- **Changing the phone does not invalidate sessions.** The user stays logged in
  under the new number.
- The verification route is `GET`, so it is safely re-openable; a second visit
  hits the `phone === user.phone` early return.

→ One-minute version: [tldr.md](tldr.md)
→ Plain-language walkthrough: [guide.md](guide.md)
