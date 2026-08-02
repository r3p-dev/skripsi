# Admin — Account

The admin's own profile. Mechanically identical to the staff and customer
versions; only the figures it shows differ.

**Code:** [`admin/profile_controller.ts`](../../app/controllers/admin/profile_controller.ts) ·
[`admin/phone_controller.ts`](../../app/controllers/admin/phone_controller.ts) ·
[`profile_service.ts`](../../app/services/profile_service.ts) ·
page [`admin/profile/show.tsx`](../../inertia/pages/admin/profile/show.tsx)

---

## 1. The figures

```ts
async show({ inertia }: HttpContext) {
  const [teamSize, transactions] = await Promise.all([
    this.dashboardService.getTeamSize(),
    this.dashboardService.getTransactionCount(),
  ])

  return inertia.render('admin/profile/show', { teamSize, transactions })
}
```

```ts
getTeamSize()         → User.query().where('role', Role.STAFF).count()
getTransactionCount() → Transaction.query().where('status', TransactionStatus.PAID).count()
```

> **Why not "total orders":** an admin places no orders, so the customer's figure
> would always read zero and say nothing. What an admin's profile can usefully
> show is the shop they are responsible for — how large the team is and how many
> payments have settled.

This is the third variant of the same idea. Each role's profile shows the number
that means something for that role:

| Role     | Figure shown                | Source                                    |
| -------- | --------------------------- | ----------------------------------------- |
| Customer | Completed orders            | `ProfileService.getTotalOrders`           |
| Staff    | Completed tasks             | `ProfileService.getCompletedTaskCount`    |
| Admin    | Team size + paid transactions | `DashboardService.getTeamSize` / `getTransactionCount` |

Note `getTransactionCount` counts **transaction rows**, not orders — so an order
that was charged twice and settled once counts once, but it is a different unit
from the dashboard's revenue figure, which counts orders. It is a "how busy is
the till" number, not an accounting one.

---

## 2. What an admin can change here

| Action                | Route                                | Service method                        |
| --------------------- | ------------------------------------ | ------------------------------------- |
| Password              | `PUT /admin/profile`                 | `ProfileService.changePassword`       |
| Phone number (step 1) | `POST /admin/phone`                  | `ProfileService.requestChangePhone`   |
| Phone number (step 2) | `GET /admin/phone/verify` (signed)   | `ProfileService.verifyPhoneChange`    |

Identical to the customer and staff flows — same service methods, same
validators, same 15-minute signed WhatsApp link, only the redirect targets
differ. Full mechanics in
[customer/account.md §5–6](../customer/account.md#5-changing-the-phone-number).

Like staff, an admin **cannot change their own name here** — the admin profile
controller handles the password only. Names are changed on the
[user management screen](users.md), which is a route an admin does have.

---

## 3. What an admin cannot do to their own account

Enforced in [`UserService`](../../app/services/user_service.ts), covered fully in
[users.md](users.md):

| Refused                    | Message                                              | Why                                                     |
| -------------------------- | ---------------------------------------------------- | ------------------------------------------------------- |
| Changing their own role    | "Anda tidak dapat mengubah peran akun Anda sendiri." | Demoting yourself is a one-way door out of the admin area |
| Deleting their own account | "Anda tidak dapat menghapus akun Anda sendiri."      | Same, with worse consequences                            |

Both are also pre-computed as `isSelf` on the edit page, so the role field is
visibly locked rather than failing on submit.

⚠️ Once an admin performs a [payment override](reconciliation.md), their account
has an `order_actions` row and becomes **undeletable by anyone** — the same rule
that protects staff and customer history. That is intended: an override must
remain attributable forever.
