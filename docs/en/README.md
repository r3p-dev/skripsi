# UmimaClean — English Documentation

UmimaClean is a shoe, bag, and helmet cleaning and repair service with pickup
and delivery in the Bandung area. Built with AdonisJS 7 + Inertia + React 19 on
PostgreSQL with PostGIS.

## How these docs are organised

Every domain has **three files**, so you can pick the depth you need:

| File           | Who it is for            | What it contains                                          |
| -------------- | ------------------------ | --------------------------------------------------------- |
| `tldr.md`      | Anyone in a hurry        | The domain in under a minute — key facts, the one gotcha  |
| `guide.md`     | Product, QA, new joiners | Plain language walkthrough of what the user actually does |
| `technical.md` | Developers               | Routes, files, data model, business rules, edge cases     |

The Indonesian mirror lives in [`../id/`](../id/) with identical folder names
(`tldr.md`, `panduan.md`, `teknis.md`).

## Roles

| Role     | Enum       | URL prefix | Lands on after login    |
| -------- | ---------- | ---------- | ----------------------- |
| Customer | `customer` | —          | `customer.profile.show` |
| Staff    | `staff`    | `/staff`   | `staff.profile.show`    |
| Admin    | `admin`    | `/admin`   | `admin.profile.show`    |

Roles are defined in [app/enums/role_enum.ts](../../app/enums/role_enum.ts).
One account has exactly one role; there is no role switching.

## Domains

### Customer

| Domain                       | What it covers                                            |
| ---------------------------- | --------------------------------------------------------- |
| [auth](customer/auth/)       | Signup, login, forgotten password, logout                 |
| [profile](customer/profile/) | Name, phone number changes, password changes              |
| [address](customer/address/) | The single saved address, map search, service-area checks |
| [orders](customer/orders/)   | Placing a pickup order, tracking it, the receipt          |
| [payment](customer/payment/) | Paying the bill by QRIS after inspection                  |

### Staff

| Domain                                            | What it covers                              |
| ------------------------------------------------- | ------------------------------------------- |
| [profile](staff/profile/)                         | Staff's own account details                 |
| [tasks](staff/tasks/)                             | The unified work queue and the claim system |
| [trips](staff/trips/)                             | Pickup and delivery runs, route planning    |
| [inspection](staff/inspection/)                   | Recording goods, pricing the order          |
| [cleaning-collection](staff/cleaning-collection/) | Marking washed, notifying, handing over     |
| [counter-orders](staff/counter-orders/)           | Walk-in orders taken at the shop            |

### Admin

| Domain                                  | What it covers                             |
| --------------------------------------- | ------------------------------------------ |
| [profile](admin/profile/)               | Admin's own account details                |
| [dashboard](admin/dashboard/)           | Live operational overview                  |
| [orders](admin/orders/)                 | Every order in the shop, filtering, export |
| [reconciliation](admin/reconciliation/) | Confirming payments taken outside the app  |
| [catalogue](admin/catalogue/)           | Services and prices                        |
| [users](admin/users/)                   | Accounts and roles                         |
| [reports](admin/reports/)               | Revenue over a date range, export          |

## The order lifecycle in one picture

```
                 ┌──────────────────┐
  online order → │ pickup_scheduled │ → cancelled
                 └────────┬─────────┘
                          ↓  staff completes pickup
                   ┌─────────────┐
                   │  in_pickup  │
                   └──────┬──────┘
                          ↓  staff opens inspection
                  ┌───────────────┐
                  │ in_inspection │
                  └───────┬───────┘
                          ↓  staff prices the goods
                 ┌──────────────────┐
                 │ awaiting_payment │ ← admin reconciles / customer pays
                 └────────┬─────────┘
                          ↓
                   ┌─────────────┐
  counter order  → │ in_cleaning │
                   └──┬───────┬──┘
        has address ↙          ↘ no address
        ┌─────────────┐      ┌────────────────┐
        │ in_delivery │      │ cleaning_done  │
        └──────┬──────┘      └───────┬────────┘
               ↓                     ↓
            ┌───────────────────────────┐
            │        completed          │
            └───────────────────────────┘
```

The allowed moves are enforced in code by `ORDER_TRANSITIONS` in
[app/services/order_service.ts](../../app/services/order_service.ts). Anything
not listed there is rejected as a validation error.

## Stack

- **Backend**: AdonisJS 7, Lucid ORM, PostgreSQL + PostGIS
- **Frontend**: Inertia.js + React 19, Tailwind CSS, shadcn-style UI, Leaflet
- **Realtime**: `@adonisjs/transmit` (SSE)
- **Notifications**: WhatsApp via Fonnte
- **Payments**: Midtrans (QRIS) plus cash/debit taken at the counter
- **Geospatial**: Nominatim (geocoding), Overpass (nearby places), PostGIS
  (service-area checks), self-hosted OSRM (route planning)
- **Exports**: ExcelJS
