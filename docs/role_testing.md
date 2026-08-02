# Role-based testing

The test suite is organised by **who is acting**, not by which file is under
test. The reason is narrow and practical: almost every defect this application
can have that actually matters is an authorisation defect — somebody seeing a
screen, a phone number or a figure that is not theirs. A suite arranged by role
makes that class of defect visible by being read, because each role's boundary
is one file you can read top to bottom.

## Folder structure

```
tests/
├── unit/
│   ├── admin/      reconciliation_validator, report_service, service_validator
│   ├── staff/      task_service
│   └── shared/     validator, order_validator, route_service, series
│
├── functional/
│   ├── guest/      access, auth
│   ├── customer/   access, address, address_validation, order, profile, transaction
│   ├── staff/      access, counter, inspection, order, profile, trip
│   ├── admin/      access, dashboard, export, order, profile, reconciliation,
│   │               report, service, signup, user
│   └── shared/     session
│
└── browser/
    ├── guest/      auth
    ├── customer/   address, order, profile
    ├── staff/      inspection, order, profile, trip
    └── admin/      dashboard, export, order, profile, reconciliation, report,
                    service, user
```

There is deliberately no `browser/shared`: nothing in the browser suite is
currently identical for every role, and an empty folder kept for symmetry only
invites somebody to file a role-specific test in it.

## What goes where

**`shared/`** is for behaviour with no permission dimension at all:

- pure input rules and calculations (`validator`, `route_service`, `series`)
- rules that are provably the same for every role (`functional/shared/session`)

**`{role}/`** is for anything that differs by who is asking. The rule of thumb
is the one the folders exist to enforce: if a test needs a conditional on the
role to say what it expects, it is two tests in two folders.

```ts
// Wrong — the assertion is now a puzzle
it('can access dashboard', () => {
  loginAs(admin || user)
})

// Right — each file says one thing
// functional/admin/access.spec.ts → an admin may open /admin/dashboard
// functional/customer/access.spec.ts → a customer is turned away from it
```

## Role permission matrix

Roles come from `app/enums/role_enum.ts`, plus `guest` — not a stored role, but
a real caller with its own boundary, so it gets its own folder.

| Capability                                | Guest | Customer | Staff | Admin |
| ----------------------------------------- | :---: | :------: | :---: | :---: |
| Landing page, sign in, sign up, reset      |   ✓   |    –     |   –   |   –   |
| Book a pickup, view own orders             |   ✗   |    ✓     |   ✗   |   ✗   |
| Pay for own order (QRIS)                   |   ✗   |    ✓     |   ✗   |   ✗   |
| Own address book, own profile              |   ✗   |    ✓     |   ✗   |   ✗   |
| Cancel own order before pickup day         |   ✗   |    ✓     |   ✗   |   ✗   |
| Task board, claim / release / complete     |   ✗   |    ✗     |   ✓   |   ✗   |
| Inspect and price an order                 |   ✗   |    ✗     |   ✓   |   ✗   |
| Record a counter order, take payment       |   ✗   |    ✗     |   ✓   |   ✗   |
| Look up a registered customer              |   ✗   |    ✗     |   ✓   |   ✗   |
| Send order WhatsApp (payment / ready)      |   ✗   |    ✗     |   ✓   |   ✗   |
| Mark a walk-in collected                   |   ✗   |    ✗     |   ✓   |   ✗   |
| Dashboard, revenue report, exports         |   ✗   |    ✗     |   ✗   |   ✓   |
| Order monitor across the whole shop        |   ✗   |    ✗     |   ✗   |   ✓   |
| Service catalogue                          |   ✗   |    ✗     |   ✗   |   ✓   |
| Account register, deactivate an account    |   ✗   |    ✗     |   ✗   |   ✓   |
| Create a staff or admin account            |   ✗   |    ✗     |   ✗   |   ✓   |
| Confirm a payment by hand (cash / debit)   |   ✗   |    ✗     |   ✗   |   ✓   |

`–` means the route is not applicable rather than refused: a signed-in user
visiting `/login` is redirected to their own home screen by `GuestMiddleware`,
not rejected.

Two boundaries are worth stating because they are not obvious:

- **An admin is refused the staff and customer screens.** Those workflows carry
  claim locks and per-customer order history; an admin wandering into the task
  board would take a stop out of the field team's queue under their own name.
- **The task board shows an order number, a badge and a distance, and nothing
  else.** Customer names, phone numbers and addresses appear only once a task
  has been claimed, at which point the claim is attributed. This is what the
  claim lock is for.

## Role → test coverage mapping

| Role         | Routes allowed / denied     | Actions allowed              | Actions denied                       |
| ------------ | --------------------------- | ---------------------------- | ------------------------------------ |
| **Guest**    | `functional/guest/access`   | sign up, sign in, reset      | every authenticated route            |
| **Customer** | `functional/customer/access`| book, pay, cancel, address   | staff and admin routes               |
| **Staff**    | `functional/staff/access`   | claim, inspect, walk-in      | customer routes, all admin routes    |
| **Admin**    | `functional/admin/access`   | manage, report, reconcile    | customer routes, staff task board    |

Each `access.spec.ts` states both halves of its role's boundary — the routes it
opens and the routes it is turned away from — so a permission change shows up
as a failure in exactly one file.

## Shared vs role-specific

| Test                                | Placement          | Why                                                 |
| ----------------------------------- | ------------------ | --------------------------------------------------- |
| `validator`, `route_service`, `series` | `unit/shared`   | pure functions, no caller                            |
| `order_validator`                   | `unit/shared`      | the same rules serve booking and counter intake      |
| `service_validator`, `reconciliation_validator` | `unit/admin` | only the admin forms submit these             |
| `report_service`                    | `unit/admin`       | revenue reporting is an admin-only feature           |
| `task_service`                      | `unit/staff`       | claim locking is the field team's workflow           |
| `functional/shared/session`         | `functional/shared`| sign-in, deactivation and reset behave identically   |
| everything else                     | `{role}/`          | the behaviour, the screen or the permission differs  |

## Running

```bash
node ace test unit                                # one suite
node ace test functional --files="admin/*"        # one role within a suite
node ace test                                     # everything
```
