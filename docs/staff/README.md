# Staff

The staff app is used in the van and at the counter. Same mobile-first shell as
the customer app (`max-w-md`, bottom tab bar), two tabs, and one governing idea:
**a staff member works one task at a time, and nobody else can touch it while
they hold it.**

## Feature documents

| Document                                            | Covers                                                                |
| --------------------------------------------------- | --------------------------------------------------------------------- |
| [task-board.md](task-board.md)                      | The three queues, the claim/release lock, one-task-at-a-time routing   |
| [pickup-and-delivery.md](pickup-and-delivery.md)    | Route ordering, claiming a stop, proof photos, completion              |
| [inspection.md](inspection.md)                      | Recording and pricing items; the correction window afterwards          |
| [cleaning.md](cleaning.md)                          | The wash queue, before/after photos, and the two exits                 |
| [walk-in-order.md](walk-in-order.md)                | Counter orders, on-the-spot payment, the printable rack tag            |
| [account.md](account.md)                            | Staff profile, completed-task count, phone change                      |

## Routes at a glance

All prefixed `/staff`, all behind `middleware.auth()` + `middleware.role(Role.STAFF)`.

| Method | URL                                          | Route name                    | Purpose                                    |
| ------ | -------------------------------------------- | ----------------------------- | ------------------------------------------ |
| GET    | `/staff/trips`                               | `staff.trip.index`            | The task board (home)                      |
| GET    | `/staff/trips/:number/:type`                 | `staff.trip.show`             | Open — and thereby **claim** — a stop      |
| PUT    | `/staff/trips/:number/:type`                 | `staff.trip.update`           | Complete with a proof photo                |
| DELETE | `/staff/trips/:number/:type`                 | `staff.trip.destroy`          | Release the claim                          |
| GET    | `/staff/inspections/:number`                 | `staff.inspection.show`       | Open — and claim — an inspection           |
| PUT    | `/staff/inspections/:number`                 | `staff.inspection.update`     | Submit items + photo, price the order      |
| DELETE | `/staff/inspections/:number`                 | `staff.inspection.destroy`    | Release the inspection                     |
| PUT    | `/staff/cleanings/:number`                   | `staff.cleaning.update`       | Mark the batch washed                      |
| GET    | `/staff/orders/create`                       | `staff.order.create`          | Walk-in intake form                        |
| POST   | `/staff/orders`                              | `staff.order.store`           | Create the walk-in order                   |
| GET    | `/staff/orders/:number/items`                | `staff.order.edit`            | Correct items (only while awaiting payment)|
| PUT    | `/staff/orders/:number/items`                | `staff.order.update`          | Save corrected items, reprice              |
| GET    | `/staff/orders/:number/tag`                  | `staff.tag.show`              | Printable rack tag                         |
| POST   | `/staff/orders/:number/transactions`         | `staff.transaction.store`     | Start a QRIS charge at the counter         |
| GET    | `/staff/orders/:number/transactions/latest`  | `staff.transaction.show`      | Show the QR screen                         |
| GET/PUT| `/staff/profile`                             | `staff.profile.*`             | Profile, password                          |
| POST   | `/staff/phone`, GET `/staff/phone/verify`    | `staff.phone.*`               | Verified phone change                      |

`:type` is constrained by the router to `pickup|delivery`:

```ts
router.get('trips/:number/:type', [...]).where('type', /^(pickup|delivery)$/)
```

so a made-up task type is a 404 before any controller runs.

## Navigation

[`staff_layout.tsx`](../../inertia/components/layouts/staff_layout.tsx) has two
tabs — **Tugas** (tasks, covering the board and every task screen) and **Profil**.
The tag page and the payment page render outside the shell so they print and
present cleanly.

## What staff cannot do

- See or edit the service catalogue prices (admin only)
- See revenue, reports, or the dashboard
- Manage accounts
- Confirm a payment that Midtrans never confirmed (admin only — see
  [admin/reconciliation.md](../admin/reconciliation.md))
- Complete or release a task another staff member holds

That last one is not a UI convention; it is enforced in
[`TaskService.getTaskOrderHeldBy`](../../app/services/task_service.ts) on every
mutating call.
