# Architecture

Everything a feature document assumes you already know: how a request travels
through the app, where business logic is allowed to live, what the tables mean,
and the handful of conventions that repeat everywhere.

---

## 1. The stack, and why it is boring on purpose

| Layer          | Choice                                          | Consequence for you                                                     |
| -------------- | ----------------------------------------------- | ----------------------------------------------------------------------- |
| HTTP framework | AdonisJS 7 (Node 24, TypeScript, ESM)           | Controllers, DI container, named routes, VineJS validation              |
| ORM            | Lucid 22 over PostgreSQL                        | Active-record models; `db.transaction()` for atomicity                  |
| UI             | React 19 + Inertia.js 2                         | **No REST API.** Controllers render page components with props          |
| Styling        | Tailwind 4 + shadcn-style components            | `inertia/components/ui/*` are generated primitives — avoid hand-editing |
| Realtime       | `@adonisjs/transmit` (server-sent events)       | One channel: `orders/:orderNumber`                                      |
| Files          | `@adonisjs/drive`, local `fs` disk, **private** | Proof photos; access via signed URLs                                    |
| Payments       | Midtrans **Core API** (not Snap)                | Server-to-server charge + signed webhook                                |
| WhatsApp       | Fonnte HTTP API                                 | Password reset + phone verification links                               |
| Spreadsheets   | ExcelJS                                         | Every admin screen exports                                              |

There is **one process and one database**. No queue, no worker, no cache server.
Anything that looks like a background job is done inline inside the request.

---

## 2. Request lifecycle

```
Browser
  │
  ├─ server middleware  (start/kernel.ts)
  │     container bindings → static → cors → vite → inertia
  │
  ├─ router middleware
  │     bodyparser → session → shield (CSRF) → auth init → silent auth
  │
  ├─ named middleware, per route group
  │     guest()  |  auth()  |  role(Role.X)
  │
  ├─ rate limiter, on sensitive routes only  (start/limiter.ts)
  │
  ├─ Controller           app/controllers/<role>/<feature>_controller.ts
  │     • validates the request with a VineJS validator
  │     • calls exactly one (sometimes two) services
  │     • transforms models for the wire
  │     • renders an Inertia page or redirects with a flash message
  │
  ├─ Service              app/services/*.ts
  │     • ALL business rules live here
  │     • throws E_VALIDATION_ERROR for rule violations
  │
  └─ Model / DB           app/models/*.ts → database/schema.ts (generated)
```

### Middleware that matters

| Middleware                                                              | Behaviour                                                                                                                |
| ----------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| [`auth_middleware.ts`](../app/middleware/auth_middleware.ts)             | Unauthenticated → redirect `/login`                                                                                      |
| [`guest_middleware.ts`](../app/middleware/guest_middleware.ts)           | Already signed in → redirect to that role's home (`RoleRedirect`), reflashing session messages                           |
| [`role_middleware.ts`](../app/middleware/role_middleware.ts)             | Wrong role → flash `"Anda tidak memiliki akses ke halaman ini"` and redirect to **their own** home. Never a 403 page.    |
| [`inertia_middleware.ts`](../app/middleware/inertia_middleware.ts)       | Shares `errors`, `flash.{success,error}` and the transformed `user` with **every** page render                           |

`RoleRedirect` in [`app/enums/role_enum.ts`](../app/enums/role_enum.ts) is the
single source of "where does this role belong":

```ts
customer → customer.order.create   // /order
staff     → staff.trip.index        // /staff/trips
admin     → admin.dashboard.index   // /admin/dashboard
```

### URL prefixes — the asymmetry that trips people up

In [`start/routes.ts`](../start/routes.ts):

- The **customer** group uses `.as(Role.CUSTOMER)` only → route *names* are
  prefixed (`customer.order.show`) but URLs are **not** (`/orders/ORD260728-001`).
- **staff** and **admin** groups use `.prefix(...)` *and* `.as(...)` → both the
  URL and the name are prefixed (`/staff/trips`, `staff.trip.index`).

> **Why:** the customer app is the public-facing product. `umimaclean.com/orders`
> reads better on a phone than `umimaclean.com/customer/orders`. Staff and admin
> are internal, so the prefix is free clarity.

---

## 3. Where logic is allowed to live

This is the rule the whole codebase follows, and the one to hold new code to:

| Layer           | May do                                                                             | May **not** do                                          |
| --------------- | ---------------------------------------------------------------------------------- | ------------------------------------------------------- |
| **Validator**   | Shape, type, format, uniqueness of a payload                                        | Know about order status or roles                        |
| **Controller**  | Read the request, call services, choose the page/redirect, format for the wire      | Contain a business rule or query a model directly       |
| **Service**     | Enforce every business rule, own transactions, throw validation errors              | Touch `request` / `response` (one deliberate exception¹) |
| **Transformer** | Turn a model into the plain object a page receives                                  | Query, decide, or compute business values               |
| **Model**       | Relations and column mapping                                                        | Business rules (there are no lifecycle hooks in use)    |

¹ [`ExcelService`](../app/services/excel_service.ts) writes the HTTP response
because producing a download *is* the whole job — see [admin/exports.md](admin/exports.md).

### Services and their responsibilities

| Service                                                                | Owns                                                                    |
| ---------------------------------------------------------------------- | ----------------------------------------------------------------------- |
| [`AuthService`](../app/services/auth_service.ts)                       | Signup, login/logout, WhatsApp password reset                           |
| [`ProfileService`](../app/services/profile_service.ts)                 | Own-account changes: name, password, verified phone change              |
| [`AddressService`](../app/services/address_service.ts)                 | The single active address + service-area geometry                       |
| [`OrderService`](../app/services/order_service.ts)                     | Creating online & walk-in orders, order numbers, capacity, cancellation  |
| [`TaskService`](../app/services/task_service.ts)                       | Staff queues, the claim/release lock, task completion, order items       |
| [`RouteService`](../app/services/route_service.ts)                     | Haversine distance and nearest-first ordering                            |
| [`TransactionService`](../app/services/transaction_service.ts)         | Midtrans charge, webhook handling, Transmit broadcast                    |
| [`ReconciliationService`](../app/services/reconciliation_service.ts)   | The admin-only manual payment override                                   |
| [`CatalogueService`](../app/services/catalogue_service.ts)             | The service price list                                                   |
| [`UserService`](../app/services/user_service.ts)                       | Admin account management + delete/demote safeguards                      |
| [`DashboardService`](../app/services/dashboard_service.ts)             | Read-only dashboard aggregation                                          |
| [`ReportService`](../app/services/report_service.ts)                   | Read-only revenue reporting                                              |
| [`ExcelService`](../app/services/excel_service.ts)                     | Workbook building and the file download                                  |
| [`FonnteService`](../app/services/fonnte_service.ts)                   | WhatsApp delivery                                                        |

Services are constructor-injected with `@inject()`. `TaskService` depends on
`RouteService`; `OrderService` depends on `TaskService` and `TransactionService`.

---

## 4. Data model

```
users ──< addresses ──< orders >── (address_id, nullable)
  │                        │
  │                        ├──< order_items >── services   (RESTRICT)
  │                        │         └────────── items     (CASCADE)
  │                        ├──< order_actions >── users     (staff_id)
  │                        └──< transactions
  │
  └──< notifications        ← table exists, nothing writes to it (see §8)
```

Migrations are in [`database/migrations/`](../database/migrations/). The
`BaseModel` column definitions are **generated** into
[`database/schema.ts`](../database/schema.ts) by `node ace migration:run` — never
hand-edit it. Models in `app/models/` extend those generated classes and add
only relations.

### Table-by-table

**`users`** — `role` (`customer` | `staff` | `admin`), `name`, `phone` (unique,
this is the login identity), `password` (hashed by the `withAuthFinder` mixin).
There is no email anywhere in the system.

**`addresses`** — belongs to a user, carries `latitude`/`longitude` and an
`is_active` flag. A partial unique index enforces **one active address per user**:

```sql
CREATE UNIQUE INDEX one_active_address_per_user ON addresses (user_id) WHERE is_active = true
```

Deleting a user is `RESTRICT`ed by orders, so old addresses are kept forever as
the historical record of where an order was collected.

**`orders`** — the spine.

| Column                          | Meaning                                                                                     |
| ------------------------------- | ------------------------------------------------------------------------------------------- |
| `order_number`                  | `ORDYYMMDD-NNN`, unique, resets daily. Customer-facing identity.                             |
| `user_id`                       | **Nullable** — walk-in orders have no account behind them                                    |
| `address_id`                    | **Nullable** — walk-in orders have no address. This is what decides delivery vs. done.       |
| `customer_name`, `customer_phone` | Copied at creation. For online orders they come from the *address*, not the account.       |
| `status`                        | See [order-lifecycle.md](order-lifecycle.md)                                                 |
| `type`                          | `online` \| `offline`                                                                        |
| `pickup_date`                   | Nullable; only online orders have one                                                        |
| `total_price`                   | **Nullable until priced** — an online order has no total until inspection                    |

**`items`** — the physical thing being cleaned (brand, model, material, size,
condition, note). Created fresh at inspection or walk-in intake; an item belongs
to exactly one order's lines and is deleted when those lines are replaced.

**`order_items`** — one row per *(item × service)* pair. Carries a **frozen copy**
of the service name and price:

```ts
name:     `${service.name} - ${item.brand} ${item.model}`,
price:    Number(service.price),
subtotal: price,
```

> **Why this matters more than anything else in the schema:** the catalogue is
> editable. If order lines pointed at the live price, raising the price of
> "Deep Clean Sepatu" tomorrow would silently rewrite what last month's
> customers were charged, break the receipt, and change every historical report.
> The copy is the contract. `service_id` is kept only for reporting joins, and
> its FK is `RESTRICT` so a service that has priced an order can never be deleted.

**`order_actions`** — the audit trail *and* the lock mechanism. One row per
thing that happened, naming `staff_id`, an optional `photo_path`, an optional
`note`, and a `name` from `ActionName`. Detailed in
[order-lifecycle.md](order-lifecycle.md) and [staff/task-board.md](staff/task-board.md).

**`transactions`** — one row per payment attempt. `payment_method`
(`cash`|`qris`|`debit`), Midtrans identifiers, the QR image URL, and `status`.
A partial unique index allows **at most one pending transaction per order**:

```sql
CREATE UNIQUE INDEX transactions_order_id_pending_unique ON transactions (order_id) WHERE status = 'pending'
```

An order can accumulate several rows over time (expired QR → retry), which is
why revenue is summed from `orders.total_price`, never from transaction rows.

---

## 5. Conventions you will meet everywhere

### 5.1 Enums are objects, not TypeScript `enum`

```ts
export const OrderStatus = { PICKUP_SCHEDULED: 'pickup_scheduled', ... } as const
export type OrderStatus = (typeof OrderStatus)[keyof typeof OrderStatus]
```

Each enum file also exports a `...Label` map holding the Indonesian UI string.
Filter dropdowns and chart legends are built by mapping `Object.values(Enum)`,
so **adding a status makes it appear in the admin filter automatically**.

### 5.2 Transformers translate on the way out

[`app/transformers/`](../app/transformers/) turns models into plain objects. They
do three things consistently:

- format money with `formatRupiah` → `"Rp 35.000"`
- format dates with Luxon `setLocale('id')` → `"28 Juli 2026"`
- translate enums to their Indonesian label

⚠️ **Gotcha — labels are the wire format.** `OrderTransformer` sends
`status: "Menunggu Pelunasan"`, and several pages compare against that literal
string (e.g. `order.status === 'Menunggu Pelunasan'` in
[`customer/order/show.tsx`](../inertia/pages/customer/order/show.tsx)). Renaming a
label in an enum file therefore breaks page logic, not just wording.

Where a page needs the raw value it gets a second field — `statusValue`,
`typeValue`, `roleValue`, `priceValue` — which is what badge-colour maps in
[`inertia/lib/constants.ts`](../inertia/lib/constants.ts) key on. **Prefer the
`*Value` fields in new code.**

Nested relations only serialise one level deep by default. When a page needs
more, the controller calls `.depth(2)` explicitly — e.g. order items need their
item *and* their service.

### 5.3 Rule violations are validation errors

Services throw `vineErrors.E_VALIDATION_ERROR` with a field name, so a broken
business rule renders as an inline form error rather than a 500:

```ts
throw new vineErrors.E_VALIDATION_ERROR([
  { field: 'pickupDate', message: 'Batas penjemputan per hari sudah penuh untuk tanggal ini.' },
])
```

Fields like `status`, `id` and `radius` are used as pseudo-fields when the
violation is not about one particular input.

### 5.4 Buttons are disabled, not hidden

Where an action is refusable, the *list* query pre-computes which rows can't do
it (`getUndeletableIds`, `getInUseServiceIds`, `canCancel`), and the page renders
the button disabled with an explanation. The service still enforces the rule —
the pre-computation is UX, not security.

### 5.5 Validation vocabulary is shared

[`app/validators/shared.ts`](../app/validators/shared.ts) holds the reusable
rules, so format changes happen in one place:

| Rule         | Constraint                                                                 |
| ------------ | -------------------------------------------------------------------------- |
| `name()`     | 1–50 chars, letters/spaces/dashes only                                      |
| `phone()`    | `/^08[1-9]\d{8,10}$/` — Indonesian mobile, 10–12 digits                     |
| `password()` | 8–16 chars, must contain a letter **and** a digit, alphanumerics only       |
| `image()`    | ≤5 MB, `png`/`jpg`/`jpeg`                                                   |
| `item`       | The inspected-item object (brand, model, type, size, material, condition, note, service, additionalServices) |

Indonesian error wording lives in [`start/validator.ts`](../start/validator.ts) as
a global messages provider. A form that needs one field relabelled clones it —
see [`service_validator.ts`](../app/validators/service_validator.ts).

`start/validator.ts` also globally converts VineJS dates to **Luxon `DateTime`**,
which is why `data.pickupDate.toFormat(...)` works straight out of a validator.

### 5.6 Rate limiting

[`start/limiter.ts`](../start/limiter.ts), backed by the `rate_limits` table:

| Limiter           | Allowance                | Key                       |
| ----------------- | ------------------------ | ------------------------- |
| `signup`          | 10 / min, block 10 min   | IP                        |
| `login`           | 5 / min, block 5 min     | IP + submitted phone      |
| `forgot-password` | 1 / 15 min, block 15 min | IP                        |
| `reset-password`  | 5 / 15 min               | IP + URL                  |
| `midtransCharge`  | 5 / 15 min               | **order id**, not IP      |

The Midtrans limiter is applied *inside* `TransactionService`, not on the route,
because most "pay" requests reuse the existing pending QR and never reach
Midtrans — only a genuinely new charge should be metered.

---

## 6. Realtime (Transmit)

One channel exists: `orders/:orderNumber`. Authorisation is in
[`start/routes.ts`](../start/routes.ts):

```ts
if (user.role === Role.STAFF) return true          // any staff, any order
return order?.userId === user.id                    // customers: own orders only
```

⚠️ **Gotcha:** admins are **not** granted access by that check — an admin
subscribing to an order channel is rejected. Nothing in the admin UI subscribes,
so this is currently invisible, but it will bite whoever adds a live admin view.

Two places broadcast, both sending the same payload shape
(`{ transactionStatusLabel, orderStatusLabel }`): the Midtrans webhook and the
admin reconciliation override. The only subscriber is the shared payment page
[`inertia/pages/order/payment.tsx`](../inertia/pages/order/payment.tsx), and only
while the transaction is pending.

---

## 7. File storage

Proof photos go to the local `fs` disk (`storage/`), configured **private** in
[`config/drive.ts`](../config/drive.ts). `TaskService.storePhoto` writes to
`<folder>/<uuid>.<ext>` where folder is `pickup`, `delivery`, `inspection`, or
`cleaning`, then stores a **signed URL** valid for 90 days:

```ts
const key = `${folder}/${randomUUID()}.${photo.extname}`
await drive.use().putStream(key, createReadStream(photo.tmpPath!))
return drive.use().getSignedUrl(key, { expiresIn: PHOTO_RETENTION })  // '90d'
```

⚠️ **Gotcha:** `order_actions.photo_path` holds a **signed URL, not a storage
key**. After 90 days the link stops working and the row cannot regenerate it,
because the key is only recoverable by parsing the URL. That is deliberate —
photos are retained 90 days and then deleted — but if retention policy changes,
this is the line to change, and old rows will need migrating.

---

## 8. Things that exist but are not wired up

Know these so you don't go looking for the missing half:

- **`notifications` table + `Notification` model** — created and related to
  `User`, but nothing reads or writes it. In-app notifications were scoped and
  not built; WhatsApp (Fonnte) covers the messaging that shipped.
- **`inertia/pages/staff/task/edit.tsx`** — a placeholder returning `<div>Edit</div>`.
  No route or controller renders it. The real correction screen is
  `staff/order/edit`.
- **`offlineOrderValidator.totalItems`** — validated but never read by
  `createOfflineOrder`; the item count is derived from `items.length`.
- **`customerValidator`** in [`order_validator.ts`](../app/validators/order_validator.ts)
  — exported, unused.

---

## 9. Testing

`pnpm test` runs three suites (see [`tests/`](../tests/)):

| Suite        | What it proves                                                             |
| ------------ | -------------------------------------------------------------------------- |
| `unit/`      | Pure logic — validators, `RouteService` maths, `ReportService`, series fill |
| `functional/`| Full HTTP through the real router, DB and middleware, including role access |
| `browser/`   | Playwright against the real React UI                                       |

Factories live in [`database/factories/`](../database/factories/). Functional
tests are the fastest way to understand a feature's contract — when a document
here and the code disagree, the spec file usually settles it.

---

## 10. Running it

```bash
pnpm install
cp .env.example .env          # DB + MIDTRANS_* + FONNTE_API_KEY + APP_URL
node ace generate:key
node ace migration:run        # also regenerates database/schema.ts
node ace db:seed              # catalogue + the one bootstrap admin account
pnpm dev
```

`db:seed` creates the only admin that exists on a fresh database —
phone `081200000001`, password `admin12345`, defined in
[`user_seeder.ts`](../database/seeders/user_seeder.ts). It is idempotent (matched
on phone) and **the password must be changed after first sign-in**. Every other
staff and admin account is created from the admin user screen; there is no
public signup path to a privileged role.
