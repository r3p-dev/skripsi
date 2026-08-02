# Admin

The management console. Unlike the customer and staff apps this one is
**desktop-first** — an admin reads tables and charts, which need width — with the
nav collapsing behind a button on a phone.

## Feature documents

| Document                                     | Covers                                                                 |
| -------------------------------------------- | ---------------------------------------------------------------------- |
| [dashboard.md](dashboard.md)                 | Every figure on the dashboard and exactly how it is computed            |
| [order-monitor.md](order-monitor.md)         | Shop-wide order list, filters, and the detail/audit view                |
| [reconciliation.md](reconciliation.md)       | The manual payment override — the riskiest action in the product        |
| [catalogue.md](catalogue.md)                 | The service price list and why prices are frozen onto orders            |
| [users.md](users.md)                         | Account management and the lock-out safeguards                          |
| [reports.md](reports.md)                     | Revenue reporting and what "paid" means to each figure                  |
| [exports.md](exports.md)                     | The Excel export machinery shared by every screen here                  |
| [account.md](account.md)                     | Admin profile and phone change                                          |

## Routes at a glance

All prefixed `/admin`, all behind `middleware.auth()` + `middleware.role(Role.ADMIN)`.

| Method | URL                              | Route name                       |
| ------ | -------------------------------- | -------------------------------- |
| GET    | `/admin/dashboard`               | `admin.dashboard.index`          |
| GET    | `/admin/dashboard/export`        | `admin.dashboard.export`         |
| GET    | `/admin/orders`                  | `admin.order.index`              |
| GET    | `/admin/orders/export`           | `admin.order.export`             |
| GET    | `/admin/orders/:number`          | `admin.order.show`               |
| GET    | `/admin/services`                | `admin.service.index`            |
| GET    | `/admin/services/export`         | `admin.service.export`           |
| GET    | `/admin/services/create`         | `admin.service.create`           |
| POST   | `/admin/services`                | `admin.service.store`            |
| GET    | `/admin/services/:id/edit`       | `admin.service.edit`             |
| PUT    | `/admin/services/:id`            | `admin.service.update`           |
| DELETE | `/admin/services/:id`            | `admin.service.destroy`          |
| GET    | `/admin/users` (+ export/create/edit/update/destroy) | `admin.user.*`  |
| GET    | `/admin/reports`                 | `admin.report.index`             |
| GET    | `/admin/reports/export`          | `admin.report.export`            |
| GET    | `/admin/reconciliations`         | `admin.reconciliation.index`     |
| GET    | `/admin/reconciliations/export`  | `admin.reconciliation.export`    |
| PUT    | `/admin/reconciliations/:number` | `admin.reconciliation.update`    |
| GET/PUT| `/admin/profile`                 | `admin.profile.*`                |
| POST   | `/admin/phone`, GET `/admin/phone/verify` | `admin.phone.*`         |

### One routing detail worth remembering

```ts
/**
 * Registered ahead of `orders/:number`, which would otherwise match first
 * and go looking for an order numbered "export".
 */
router.get('orders/export', [controllers.admin.Order, 'export'])
router.get('orders/:number', [controllers.admin.Order, 'show'])
```

Static segments must be registered before the dynamic ones they would collide
with. The same ordering applies to `services/export` and `users/export`.

## Navigation

[`admin_layout.tsx`](../../inertia/components/layouts/admin_layout.tsx) renders a
permanent sidebar on desktop, collapsing to a hamburger on mobile — seven
sections do not fit in a bottom tab bar.

## Cross-cutting patterns

Every list screen in this folder follows the same shape, so learn it once:

1. **A `filtersFrom(query)` private method** on the controller reads `page`,
   `search`, and any enum filters from the query string — validating enum values
   against the known options and dropping anything unrecognised.
2. **Two service methods per list**: `getX(filters)` returns a paginator of 10 for
   the screen, `getXForExport(filters)` returns the same query unpaginated up to
   `EXPORT_ROW_LIMIT`, built on a **shared private query builder** so the file and
   the screen can never disagree.
3. **Options arrays built from enums** (`STATUS_OPTIONS`, `ROLE_OPTIONS`, …), so a
   new enum value appears in the filter dropdown the day it is added.
4. **Pre-computed refusals** (`undeletableIds`, `inUseIds`, `isSelf`) so a button
   that cannot succeed is rendered disabled rather than failing on click. The
   service enforces the rule regardless.

## What only an admin can do

- Confirm a payment Midtrans never confirmed ([reconciliation](reconciliation.md))
- Create, edit, or delete a service ([catalogue](catalogue.md))
- Create any account, including staff and other admins ([users](users.md))
- See revenue, reports, and the dashboard
- Export anything to Excel
