# Customer — Account & Authentication

Signing up, signing in, recovering a password over WhatsApp, changing a phone
number, and the profile screen.

**Code:**
[`auth_service.ts`](../../app/services/auth_service.ts) ·
[`profile_service.ts`](../../app/services/profile_service.ts) ·
[`fonnte_service.ts`](../../app/services/fonnte_service.ts) ·
controllers under [`app/controllers/auth/`](../../app/controllers/auth/) and
[`app/controllers/customer/`](../../app/controllers/customer/)

---

## 1. The identity is a phone number

There is **no email anywhere in the system**. The `users` table has
`name`, `phone` (unique), `password`, `role` — that is all. The auth finder is
configured on the phone column:

```ts
// app/models/user.ts
const AuthFinder = withAuthFinder(hash, { uids: ['phone'], passwordColumnName: 'password' })
```

> **Why:** the business runs on WhatsApp. Customers give a phone number without
> hesitating and check WhatsApp constantly; many would have to invent an email
> address, and a password-reset email would sit unread. Making the phone number
> the login identity means the same value is the account key, the reset channel,
> and the number staff call from the van.

Phone format is enforced by the shared rule in
[`shared.ts`](../../app/validators/shared.ts):

```ts
/^08[1-9]\d{8,10}$/     // 08 + non-zero + 8–10 more digits → 11–13 digits total
```

Passwords must be 8–16 characters, alphanumeric only, containing **at least one
letter and one digit**.

---

## 2. Signup

`GET /signup` → `POST /signup` (rate-limited: 10/min per IP, then blocked 10 min)

```
SignupController.store
  └─ signupValidator          name, phone (unique in users), password + confirmation
  └─ AuthService.signup(payload, auth)
       └─ User.create({ ...data, role: Role.CUSTOMER })
       └─ auth.use('web').login(user)          ← logged in immediately
  └─ redirect → customer.order.create
```

`AuthService.signup` takes an optional third `role` argument, but the public
controller never passes it — the default is hard-wired to `Role.CUSTOMER`.

> **Why that matters:** it is the reason the public form can never mint a
> privileged account. Staff and admin accounts are created **only** through
> [`UserService.createUser`](../admin/users.md), behind the admin role
> middleware. There is no "register as staff" path to audit, because there is no
> path at all.

The password is hashed by the model mixin on assignment — nothing in the service
layer touches `hash` directly.

New customers land on the booking screen, which will immediately tell them they
need an address before they can order. See [address.md](address.md).

---

## 3. Login

`GET /login` → `POST /login` (rate-limited: 5/min keyed on **IP + submitted
phone**, then blocked 5 min).

```
SessionController.store
  └─ loginValidator            phone, password, rememberMe?
  └─ AuthService.login → User.verifyCredentials(phone, password)
                       → auth.use('web').login(user, rememberMe)
  └─ redirect → RoleRedirect[user.role]
```

Two details worth knowing:

**Credential errors are rewritten as validation errors.** The controller catches
`E_INVALID_CREDENTIALS` and re-throws a VineJS error attached to *both* fields:

```ts
{ field: 'phone',    message: 'Nomor telepon atau kata sandi salah.' },
{ field: 'password', message: 'Nomor telepon atau kata sandi salah.' },
```

> **Why:** the same message on both fields means the form cannot be used to
> discover which phone numbers have accounts — and it renders as an inline form
> error instead of an exception page.

**The redirect is role-driven.** Everyone uses the same login form; where you
land is decided by `RoleRedirect`. `remember_me_tokens` are stored in their own
table with a cascading FK on the user.

`POST /logout` (auth required) destroys the session and returns to `/`.

---

## 4. Password reset over WhatsApp

Four routes, all behind `middleware.guest()`:

```
GET  /forgot-password    form
POST /forgot-password    request a link      (1 per 15 min per IP)
GET  /reset-password     the signed link     (opened from WhatsApp)
POST /reset-password     set the new password (5 per 15 min)
```

### Requesting

```ts
// AuthService.requestPasswordReset
const user = await User.findBy('phone', data.phone)
if (!user) return                                    // silent

const resetUrl = signedUrlFor('password_reset.edit', {}, {
  qs: { phone: user.phone },
  expiresIn: '15m',
  prefixUrl: appUrl,
})

await this.fonnteService.sendPasswordResetLink(user.phone, resetUrl)
```

Two deliberate choices:

- **Unknown numbers are ignored silently**, and the controller flashes a message
  worded so it reveals nothing either way:
  *"Jika akun dengan nomor telepon tersebut ada, tautan… telah dikirim"* — "if an
  account with that number exists, a link has been sent". The endpoint cannot be
  used to enumerate customers.
- **The link is an AdonisJS signed URL**, not a token row. The phone number
  travels in the query string and the signature covers it, so nothing needs to be
  stored, expired, or cleaned up. It is valid for 15 minutes.

`FonnteService` posts to `https://api.fonnte.com/send`. ⚠️ Fonnte answers HTTP
200 even when it rejects a message, so the service checks the response body's own
`status` flag as well and throws otherwise. The controller catches that and
flashes an error — a WhatsApp outage shows a message, not a stack trace.

### Resetting

Both `edit` and `update` re-check `request.hasValidSignature()` **and** the
presence of `phone`. A tampered or expired link renders
[`errors/invalid_signature`](../../inertia/pages/errors/invalid_signature.tsx)
instead of the form.

```ts
// AuthService.resetPassword — phone comes from the *verified* query string
const user = await User.findByOrFail('phone', phone)
await user.merge({ password: data.password }).save()
```

⚠️ **Gotcha:** the reset does **not** invalidate existing sessions or
remember-me tokens. Someone already signed in on another device stays signed in
after a password reset. If that matters for your threat model, this is the place
to add it.

---

## 5. Changing the phone number

Because the phone number *is* the login identity, changing it is a two-step,
proof-of-ownership flow. Owned by `ProfileService`.

```
POST /phone                        → send a verification link to the NEW number
GET  /phone/verify?phone=…&signature=…   → apply the change
```

### Step 1 — request (`requestChangePhone`)

Refuses in two cases before sending anything:

| Condition                      | Message                                                    |
| ------------------------------ | ---------------------------------------------------------- |
| New number equals current      | "Nomor telepon baru tidak boleh sama dengan yang lama"      |
| Number already used by someone | "Nomor telepon sudah digunakan"                             |

Then it sends a 15-minute signed link **to the new number** over WhatsApp.

> **Why send to the new number rather than the old one:** the point is to prove
> the customer actually controls the number they are moving to. A link sent to
> the old number would only prove they control the number they already have.
> The consequence is that a typo'd number simply never verifies — the account
> keeps the old one, which is the safe failure.

The verification route is role-specific:

```ts
const PHONE_VERIFICATION_ROUTE = {
  customer: 'customer.phone.update',
  staff:    'staff.phone.update',
  admin:    'admin.phone.update',
}
```

> **Why:** each role has its own copy of the screen behind its own role
> middleware. A staff member sent to `customer.phone.update` would be bounced
> back to their own home by the role middleware and the change would silently
> never apply.

### Step 2 — verify (`verifyPhoneChange`)

The `GET` route checks the signature, then:

```ts
return user.merge({ phone }).save()
```

⚠️ **Gotchas here, all consequences of doing this with a signed URL rather than
a stored request:**

- The link is applied to **whoever is signed in when it is opened**, not to the
  user who requested it. In practice both are the same person on the same phone,
  but the signature does not bind the request to a user id.
- Uniqueness was checked when the link was *issued*. If someone else claims that
  number in the intervening 15 minutes, applying the link hits the database
  unique constraint and surfaces as a 500 rather than a friendly message.

---

## 6. Changing the password (signed in)

`PUT /password` → `ProfileService.changePassword`:

```ts
const isCurrentPasswordCorrect = await user.verifyPassword(data.currentPassword)
if (!isCurrentPasswordCorrect) throw E_VALIDATION_ERROR('currentPassword', 'Kata sandi saat ini salah')
return user.merge({ password: data.password }).save()
```

The current password is required — a hijacked session cannot lock the owner out
without knowing it. Staff and admin have the same flow on their own routes,
using the same service method.

---

## 7. The profile screen

`GET /profile` →
[`customer/profile/show.tsx`](../../inertia/pages/customer/profile/show.tsx)

It shows the name, phone, **total completed orders**, and the active address,
with forms for name, phone and password changes.

```ts
// ProfileService.getTotalOrders — completed only
await user.loadCount('orders', (query) => query.where('status', OrderStatus.COMPLETED))
```

> **Why "completed only":** the number is presented to the customer as a
> loyalty-ish figure ("you have had N orders done"). Counting cancelled or
> in-flight orders would inflate it and make it mean nothing.

Staff and admin profiles show a different figure for the same reason — staff
place no orders, so theirs counts *completed tasks*, and an admin's shows team
size and settled transactions. See [staff/account.md](../staff/account.md) and
[admin/account.md](../admin/account.md).

---

## 8. Where to change things

| To change…                            | Edit                                                                    |
| ------------------------------------- | ----------------------------------------------------------------------- |
| Phone or password format              | [`app/validators/shared.ts`](../../app/validators/shared.ts)            |
| Indonesian validation wording         | [`start/validator.ts`](../../start/validator.ts)                        |
| Rate limits                           | [`start/limiter.ts`](../../start/limiter.ts)                            |
| Link lifetime (15 min)                | `expiresIn` in `AuthService` / `ProfileService`                         |
| WhatsApp message text                 | [`fonnte_service.ts`](../../app/services/fonnte_service.ts)             |
| Where each role lands after login     | `RoleRedirect` in [`role_enum.ts`](../../app/enums/role_enum.ts)        |
