# UmimaClean — Shoe Care Operations Platform

An end-to-end operations platform for **UmimaClean**, a shoe, bag, and helmet cleaning service in the Bandung Raya area. The system takes an order from the moment a customer books a pickup on their phone through collection, inspection, pricing, payment, cleaning, and delivery — and gives the owner a single place to see the money and the workload behind it all.

---

## The problem it solves

A cleaning service of this kind runs on messages, notebooks, and memory. Orders arrive over WhatsApp, prices are quoted verbally, staff assignments are agreed in a group chat, and revenue is worked out at the end of the month from a stack of receipts. That works until it doesn't: two staff drive to the same address, a customer is quoted one price and charged another, an order sits finished on a shelf because nobody remembers whose it is, and the owner cannot answer basic questions about which services actually earn money.

UmimaClean replaces that with one shared record of what happened. Every order has a number, a status anyone can look up, an itemised price, a payment trail, and a log of which staff member did what and when.

---

## Who uses it

The platform serves three distinct audiences, each with its own purpose-built experience.

| Audience                         | What they do                                                                           | How they use it                            |
| -------------------------------- | -------------------------------------------------------------------------------------- | ------------------------------------------ |
| **Customers** (Pelanggan)        | Book a pickup, track their order, pay, collect a receipt                               | Mobile-first, on their own phone           |
| **Field & shop staff** (Petugas) | Claim pickups and deliveries, inspect and price items, record cleaning, serve walk-ins | Mobile-first, in the van or at the counter |
| **Owner / management** (Admin)   | Monitor the shop, manage the catalogue and accounts, resolve payments, read reports    | Desktop-first, adapting down to mobile     |

Nobody sees anything outside their role. Staff and administrator accounts have no public sign-up path at all — they can only be created from inside the admin area, so the public form can never mint a privileged account.

---

## How an order moves

The heart of the system is a single, unambiguous order lifecycle. Every participant — customer, staff, and owner — is looking at the same status at the same time.

```mermaid
flowchart TD
    A[Customer books a pickup] --> B[Penjemputan Dijadwalkan]
    B --> C[Dalam Penjemputan]
    C --> D[Dalam Inspeksi]
    D --> E[Menunggu Pelunasan]
    E --> F[Dalam Pencucian]
    F --> G[Dalam Pengantaran]
    G --> H[Selesai]

    W[Walk-in served at the counter] --> F
    F -.customer collects in person.-> H

    B -.customer cancels before pickup day.-> X[Dibatalkan]
```

1. **Booking.** The customer picks a date and a saved address. Each day has a fixed pickup capacity, so the team is never booked beyond what it can physically collect.
2. **Collection.** A staff member claims the pickup, which immediately shows the customer that someone is on the way. Completion is recorded with a proof photo.
3. **Inspection.** Staff record each item — brand, model, material, size, condition — and select the services it needs. This is where the price is set, and it is itemised rather than a single number.
4. **Payment.** The customer receives the quote and pays by QRIS. Prices are copied onto the order at inspection time, so a later change to the catalogue never reprices work that has already been quoted.
5. **Cleaning.** The order enters the wash. A printable tag lists every item in the batch so nothing is mixed up on the rack.
6. **Delivery.** Staff claim the delivery run and confirm hand-over with a proof photo, which closes the order.

**Walk-in orders** follow a shorter path: staff record the items and take payment at the counter in cash, by debit, or by QRIS, and the order goes straight into cleaning. Because there is no address to deliver to, it closes as soon as cleaning is finished and the customer collects.

---

## What each role gets

### For customers

- **Book a pickup** for a chosen date, from a saved address
- **Live order tracking** — the status updates on screen as staff work, without refreshing
- **An itemised quote** showing exactly what is being cleaned and what each service costs
- **QRIS payment** with the order moving on the moment payment clears
- **A receipt** for every completed order
- **Self-service account management** — address book, phone number, password

### For staff

- **A task board** of available pickups, deliveries, and inspections, organised into routes
- **Claim-and-release** so two people never drive to the same address, and an abandoned task returns to the pool
- **Proof-of-work photos** captured at collection and hand-over
- **Structured inspection** that records the item and prices it from the live catalogue
- **Walk-in intake** for customers who arrive at the counter
- **Printable order tags** for the cleaning rack

### For management

- **Dashboard** — orders in progress, revenue, payments awaiting settlement, customer and staff counts, revenue trend, and forward pickup load against capacity
- **Order monitor** — every order in the shop, online and walk-in, filterable by status and type and searchable by number, name, or phone, with a full detail view including the audit trail
- **Payment reconciliation** — a controlled way to settle orders whose payment confirmation never arrived
- **Service catalogue** — the price list the whole business quotes from
- **User management** — customer, staff, and administrator accounts
- **Revenue reporting** — totals, averages, daily trend, breakdown by payment method and by order type, and a ranking of the services that actually earn

---

## Reporting and data export

Every management screen can be exported to a **Microsoft Excel workbook** in one click.

| Export         | What the file contains                                                                                         |
| -------------- | -------------------------------------------------------------------------------------------------------------- |
| Dashboard      | Six sheets — headline figures, orders by status, online vs. walk-in, revenue trend, pickup load, recent orders |
| Orders         | Every order matching the current filters, with customer, address, dates, payment state, and total              |
| Reconciliation | The full backlog of unsettled payments, ready to be checked against a bank statement                           |
| Services       | The complete price list                                                                                        |
| Users          | The account register, by role                                                                                  |
| Revenue report | Five sheets — summary, daily revenue, payment methods, order types, top services                               |

Two things make these files genuinely usable rather than merely available:

- **The file matches the screen.** An export carries whatever filters, search terms, and date range the user is looking at — but never stops at the page they happen to be on. What you filter is what you get, in full.
- **The numbers are numbers.** Amounts are written as real currency values and dates as real dates, so a column can be summed, sorted, filtered, and charted in Excel. Nothing arrives as text that only looks like a figure.

---

## Safeguards and accountability

The system is built on the assumption that money and customer property need a paper trail.

- **Every action is attributed.** Collections, inspections, cleaning, deliveries, and manual payment overrides are all recorded against the staff member who performed them, with a timestamp.
- **Payment overrides are deliberate and logged.** When a payment confirmation is lost in transit, only an administrator can settle the order by hand, and only after stating a reason. The override is permanently recorded in their name.
- **History cannot be quietly erased.** A customer or staff account that appears anywhere in the order record cannot be deleted, and neither can a service that has priced an order — the receipt for that order still names it.
- **Administrators cannot lock the business out.** An administrator cannot delete or demote their own account, which would otherwise be a one-way door out of the admin area.
- **Capacity is enforced, not advisory.** The daily pickup limit is applied at booking time rather than discovered when the van is already full.
- **Quoted prices are frozen.** Updating the catalogue changes what future work costs, never what past work cost.
- **Sensitive actions are rate-limited**, including sign-up, sign-in, password reset, and payment charges.

---

## Integrations

| Service                                         | Role in the platform                                                             |
| ----------------------------------------------- | -------------------------------------------------------------------------------- |
| **Midtrans**                                    | QRIS payment processing and settlement confirmation                              |
| **Fonnte (WhatsApp)**                           | Password reset and phone-verification links delivered to the customer's WhatsApp |
| **Leaflet maps** (Google map & satellite tiles) | Address pinpointing and staff route planning                                     |

---

## Technology

Deliberately a small, conventional stack — one application, one database, no moving parts that need separate operating.

| Layer                 | Choice                                                    |
| --------------------- | --------------------------------------------------------- |
| Application framework | AdonisJS 7 (Node.js, TypeScript)                          |
| User interface        | React 19 with Inertia.js and Tailwind CSS                 |
| Database              | PostgreSQL                                                |
| Live updates          | Server-sent events, for order tracking                    |
| File storage          | Local disk for proof-of-work photos, retained for 90 days |
| Spreadsheets          | ExcelJS                                                   |

The application is covered by an automated test suite spanning unit, functional, and full browser tests, which run the real interface in a real browser.

---

## Running the project

Requires **Node.js 24+**, **pnpm**, and a **PostgreSQL** database.

```bash
pnpm install                       # install dependencies
cp .env.example .env               # configure database and integration credentials
node ace generate:key              # generate the application key
node ace migration:run             # create the database schema
node ace db:seed                   # load the starting catalogue and accounts
pnpm dev                           # start the application
```

The `.env` file holds the database connection and the credentials for the two
external services — **Midtrans** (merchant ID and server key) for payments and
**Fonnte** (API key) for WhatsApp delivery.

| Command          | Purpose                                           |
| ---------------- | ------------------------------------------------- |
| `pnpm dev`       | Run the application locally with live reload      |
| `pnpm build`     | Produce a production build                        |
| `pnpm start`     | Run the production build                          |
| `pnpm test`      | Run the full test suite                           |
| `pnpm typecheck` | Verify types across the application and interface |
| `pnpm lint`      | Check code style                                  |
| `pnpm format`    | Apply formatting                                  |

---

## Project status

The platform covers the complete operational cycle described above: customer booking and payment, staff field and counter work, and management oversight, reporting, and export. It is a private, unlicensed codebase built for UmimaClean and is not distributed for reuse.
