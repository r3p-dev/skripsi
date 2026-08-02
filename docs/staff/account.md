# Staff — Account

Short by design. A staff account is created by an admin, and the staff member can
only change their own password and phone number.

**Code:** [`staff/profile_controller.ts`](../../app/controllers/staff/profile_controller.ts) ·
[`staff/phone_controller.ts`](../../app/controllers/staff/phone_controller.ts) ·
[`profile_service.ts`](../../app/services/profile_service.ts) ·
page [`staff/profile/show.tsx`](../../inertia/pages/staff/profile/show.tsx)

---

## 1. There is no staff signup

`AuthService.signup` hard-codes `Role.CUSTOMER` when the public controller calls
it. The only way a staff account comes into existence is
[`UserService.createUser`](../admin/users.md), behind the admin role middleware.

> **Why it is worth stating explicitly:** it means there is no "staff
> registration" surface to protect, no invite tokens to expire, and no
> role-escalation path through the public form. The absence is the security
> control.

Staff sign in through the same `/login` form as everyone else; `RoleRedirect`
sends them to `staff.trip.index`.

---

## 2. The profile screen

`GET /staff/profile` shows the name, phone, and one figure:

```ts
// ProfileService.getCompletedTaskCount
const COMPLETED_TASK_ACTIONS = ['pickup', 'delivery', 'inspection', 'cleaning_done']

const result = await OrderAction.query()
  .where('staff_id', staff.id)
  .whereIn('name', COMPLETED_TASK_ACTIONS)
  .count('* as total')
```

> **Why a task count rather than an order count:** staff place no orders of their
> own, so the customer's "total orders" figure would read zero on every staff
> profile and say nothing. What their profile can meaningfully show is *work
> done*, and that lives in the actions they recorded.

Note what is **excluded**: `attempt_*` and `release_*`. Claiming a task is not
work; abandoning one certainly is not. Only the four completions count.
`offline_order`, `items_edited` and `payment_override` are also excluded — the
first two are counter/correction work rather than a completed job, and the last
is an admin action.

The same design decision appears on the admin profile, which shows team size and
settled transactions instead — see [admin/account.md](../admin/account.md).

---

## 3. What staff can change

| Action                | Route                                | Service method                             |
| --------------------- | ------------------------------------ | ------------------------------------------ |
| Password              | `PUT /staff/profile`                 | `ProfileService.changePassword`            |
| Phone number (step 1) | `POST /staff/phone`                  | `ProfileService.requestChangePhone`        |
| Phone number (step 2) | `GET /staff/phone/verify` (signed)   | `ProfileService.verifyPhoneChange`         |

Both flows are **identical to the customer's** — the same service methods, the
same validators, the same 15-minute signed WhatsApp link. Only the redirect
targets and the route names differ. See
[customer/account.md §5–6](../customer/account.md#5-changing-the-phone-number) for
the full mechanics and the gotchas.

The one staff-specific detail is the verification route lookup:

```ts
const PHONE_VERIFICATION_ROUTE = {
  customer: 'customer.phone.update',
  staff:    'staff.phone.update',      // ← chosen by user.role
  admin:    'admin.phone.update',
}
```

> **Why each role needs its own copy of the screen:** the verification link is
> opened while signed in, and role middleware would bounce a staff member off
> `customer.phone.update` before the change applied. The link has to match who
> asked for it.

### What staff cannot change

**Their own name.** There is no `staff.profile.update` for the name field —
`ProfileController.update` on the staff side handles the password only. Compare
the customer controller, which does have a name form.

> **Why:** the staff member's name is what appears against every action in the
> audit trail an admin reads. Letting it be edited freely would make the trail
> less reliable. Corrections go through an admin on the
> [user management screen](../admin/users.md).

Staff also cannot change their own role, delete their own account, or create
accounts of any kind.

---

## 4. Account deletion, from the staff side

A staff member who has ever completed a task cannot be deleted at all:

```ts
// UserService.hasHistory
Order.query().where('user_id', user.id).count(...)          // orders placed
OrderAction.query().where('staff_id', user.id).count(...)   // work recorded
```

Both `orders.user_id` and `order_actions.staff_id` have `RESTRICT` foreign keys,
so the database would refuse anyway; the service check exists to turn that into
an explanation rather than a Postgres error. See [admin/users.md](../admin/users.md).

In practice this means: **a staff member who has worked is permanent.** Their
name stays attached to every collection, inspection, and delivery they performed,
which is the entire point of an audit trail.
