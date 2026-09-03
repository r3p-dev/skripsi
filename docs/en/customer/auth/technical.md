# Auth — Technical

## Routes

All of these sit in the `guest()` middleware group except logout, which requires
`auth()`. Defined in [start/routes.ts](../../../../start/routes.ts).

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

## Files

| Concern      | Path                                                                             |
| ------------ | -------------------------------------------------------------------------------- |
| Controllers  | [app/controllers/auth/](../../../../app/controllers/auth/)                       |
| Service      | [app/services/auth_service.ts](../../../../app/services/auth_service.ts)         |
| Validators   | [app/validators/auth_validator.ts](../../../../app/validators/auth_validator.ts) |
| Shared rules | [app/validators/shared.ts](../../../../app/validators/shared.ts)                 |
| Limiters     | [start/limiter.ts](../../../../start/limiter.ts)                                 |
| Role enum    | [app/enums/role_enum.ts](../../../../app/enums/role_enum.ts)                     |

## Validation rules

From `auth_validator.ts`, composed out of `shared.ts`:

```ts
name() // string, trimmed, 1–50, alpha + spaces + dashes
phone() // phoneRule({ countryCode: 'ID' }) — normalises to E.164
password() // string, trimmed, 8–16, /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,16}$/
```

| Validator                 | Fields                             | Notes                                                                                                                 |
| ------------------------- | ---------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| `loginValidator`          | `phone`, `password`, `rememberMe?` | —                                                                                                                     |
| `signupValidator`         | `name`, `phone`, `password`        | `phone` is `.unique({ table: 'users', column: 'phone' })`; `password` is `.confirmed({ as: 'passwordConfirmation' })` |
| `forgotPasswordValidator` | `phone`                            | —                                                                                                                     |
| `resetPasswordValidator`  | `password`                         | `.confirmed()`                                                                                                        |

The password regex is a whitelist: `[A-Za-z\d]{8,16}` with lookaheads requiring
at least one letter and one digit. **Symbols fail validation**, which is a
frequent source of confused bug reports.

## Data model

`users` ([migration](../../../../database/migrations/1761885935168_create_users_table.ts)):

| Column                | Type      | Notes                                     |
| --------------------- | --------- | ----------------------------------------- |
| `phone`               | string    | **unique** — the login identifier         |
| `password`            | string    | hashed by Lucid's `AuthFinder` mixin      |
| `role`                | string    | indexed; `customer` \| `staff` \| `admin` |
| `is_active`           | boolean   | indexed, defaults `true`                  |
| `password_changed_at` | timestamp | nullable; stamped on reset                |

`name` and `phone` also carry trigram GIN indexes (`users_name_trgm_index`,
`users_phone_trgm_index`) so the staff customer-picker can do
`ILIKE '%term%'` lookups without a sequential scan.

Remember-me tokens live in `remember_me_tokens`, cascading on user delete.

## Role handling

`signup` always creates `Role.CUSTOMER` — the role is never taken from user
input. Staff and admin accounts are created only by an admin through
[admin/users](../../admin/users/).

Post-login redirect is table-driven:

```ts
export const LoginRedirect = {
  [Role.CUSTOMER]: 'customer.profile.show',
  [Role.STAFF]: 'staff.profile.show',
  [Role.ADMIN]: 'admin.profile.show',
}
```

`/internal/login` and `/login` both POST to the same `auth.Session.store`; only
the rendered page differs. There is no server-side restriction preventing a
customer from logging in via the internal page — the split is presentational.

## Password reset

1. `PasswordReset.store` looks up the user by phone and sends a reset link over
   WhatsApp through `FonnteService`.
2. `PasswordReset.update` validates the new password, then `AuthService.resetPassword`:
   - merges `password` and `passwordChangedAt: DateTime.now()`
   - calls `#revokeRememberMeTokens(user)`

`#revokeRememberMeTokens` iterates `User.rememberMeTokens.all(user)` and deletes
each one. It is a sequential loop, deliberately left that way — a user holds only
a handful of tokens, and parallelising writes here risks pg's concurrent-query
warning for no meaningful gain.

## Rate limiting

Defined in [start/limiter.ts](../../../../start/limiter.ts). Every limiter throws
`E_VALIDATION_ERROR` on the `form` field, so the message surfaces inline rather
than as a 429 page.

| Limiter                 | Allowance  | Block  | Key                         |
| ----------------------- | ---------- | ------ | --------------------------- |
| `signupLimiter`         | 10 / 1 min | 10 min | `signup:{ip}`               |
| `loginLimiter`          | 5 / 1 min  | 5 min  | `login:{ip}:{phone}`        |
| `forgotPasswordLimiter` | 1 / 15 min | 15 min | `forgot-password:{ip}`      |
| `resetPasswordLimiter`  | 5 / 15 min | 15 min | `reset-password:{ip}:{url}` |

Counters persist in the `rate_limits` table (`key` primary, `expire` indexed).
Clearing that table resets all limits — useful in development.

## Edge cases

- **Guest middleware** wraps signup/login/reset. An authenticated user hitting
  those routes is redirected away, so "log in as someone else" requires an
  explicit logout first.
- **Login limiter keys on IP + phone.** Attacking one account does not lock out
  other accounts from the same IP, but it also means an attacker rotating phone
  numbers from one IP gets a fresh bucket each time. The signup limiter is
  IP-only and covers that direction.
- **`is_active`** is on the user record and indexed, but signup always sets the
  default `true`. Deactivation is an admin action.
- **No email exists anywhere.** Anything expecting an email column will not find
  one.

→ One-minute version: [tldr.md](tldr.md)
→ Plain-language walkthrough: [guide.md](guide.md)
