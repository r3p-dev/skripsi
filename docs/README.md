# UmimaClean — Developer Documentation

This folder explains **how the application actually works**, feature by feature, per
role. It is written for the person who joins the project tomorrow — or for you,
six months from now — so that you can answer "what happens when a customer taps
*Bayar Sekarang*?" without opening twenty files.

The [root README](../README.md) describes the product. This folder describes the
machinery.

---

## How to read this

Start with the three shared documents. Everything in the role folders assumes
you have read them.

| Document                                    | What it covers                                                                            |
| ------------------------------------------- | ----------------------------------------------------------------------------------------- |
| [architecture.md](architecture.md)          | Layers, request lifecycle, the data model, and the conventions every feature follows      |
| [order-lifecycle.md](order-lifecycle.md)    | The single state machine all three roles push the same order through                      |
| [glossary.md](glossary.md)                  | Indonesian ↔ English terms, enum values, and what each one means in the business          |

Then read the folder for the role you are working on.

### Customer (`docs/customer/`)

The mobile-first app a paying customer uses on their own phone. Routes live at
the URL root (`/order`, `/orders/:number`) — the customer app **has no URL
prefix**, unlike staff and admin.

| Feature                                       | What it explains                                                        |
| --------------------------------------------- | ----------------------------------------------------------------------- |
| [account.md](customer/account.md)             | Signup, login, WhatsApp password reset, phone-number change, profile    |
| [address.md](customer/address.md)             | The one-active-address model and the service-area check                 |
| [order.md](customer/order.md)                 | Booking a pickup, daily capacity, tracking, cancelling, the receipt     |
| [payment.md](customer/payment.md)             | QRIS charge, the Midtrans webhook, and live status over Transmit        |

### Staff (`docs/staff/`)

The mobile-first app used in the van and at the counter. All routes are prefixed
`/staff`.

| Feature                                              | What it explains                                                     |
| ---------------------------------------------------- | -------------------------------------------------------------------- |
| [task-board.md](staff/task-board.md)                 | The three queues, the claim/release lock, one-task-at-a-time          |
| [pickup-and-delivery.md](staff/pickup-and-delivery.md) | Route ordering, claiming a stop, proof photos, completion            |
| [inspection.md](staff/inspection.md)                 | Recording items, pricing them, and the correction window afterwards   |
| [cleaning.md](staff/cleaning.md)                     | The wash queue, before/after photos, and the two possible exits       |
| [walk-in-order.md](staff/walk-in-order.md)           | Counter orders, on-the-spot payment, and the printable rack tag       |
| [account.md](staff/account.md)                       | Staff profile, task count, phone change                              |

### Admin (`docs/admin/`)

The desktop-first management console. All routes are prefixed `/admin`.

| Feature                                            | What it explains                                                      |
| -------------------------------------------------- | --------------------------------------------------------------------- |
| [dashboard.md](admin/dashboard.md)                 | Every figure on the dashboard and exactly how it is computed          |
| [order-monitor.md](admin/order-monitor.md)         | Shop-wide order list, filters, and the detail/audit view              |
| [reconciliation.md](admin/reconciliation.md)       | The manual payment override — the riskiest action in the product      |
| [catalogue.md](admin/catalogue.md)                 | The service price list and why prices are frozen onto orders          |
| [users.md](admin/users.md)                         | Account management and the lock-out safeguards                        |
| [reports.md](admin/reports.md)                     | Revenue reporting and what "paid" means to each figure                |
| [exports.md](admin/exports.md)                     | The Excel export machinery shared by every admin screen               |
| [account.md](admin/account.md)                     | Admin profile and phone change                                        |

---

## The 60-second version

1. A **customer** signs up with a phone number, saves one pickup address, and
   books a pickup for a date. The day has a hard capacity of 10 pickups.
2. A **staff** member opens the trip queue, claims that stop (which locks it to
   them and tells the customer someone is on the way), collects the shoes, and
   uploads a photo.
3. The order lands in the **inspection** queue. Staff record every physical item
   and pick the services it needs. The catalogue price is **copied onto the
   order line** at that moment and never re-read. The order total is now set.
4. The customer pays by **QRIS**. Midtrans calls a webhook; the order moves into
   cleaning by itself. If the webhook is lost, an **admin** settles it by hand
   through reconciliation, leaving a signed audit record.
5. Staff mark the batch washed. If the order has an address it joins the
   delivery queue; a walk-in has no address, so it closes right there.
6. Staff claim the delivery, hand over, upload a photo — order **completed**.

Every one of those steps writes a row into `order_actions` naming the staff
member and the moment. That table is the audit trail, and it is also how the
task lock is derived. See [order-lifecycle.md](order-lifecycle.md).

---

## Conventions used in these docs

- **File references** are relative links you can click, e.g.
  [`app/services/order_service.ts`](../app/services/order_service.ts).
- **"Why" boxes** explain a decision that looks arbitrary until you know the
  business reason. Those are the paragraphs worth reading twice.
- **⚠️ Gotcha** marks behaviour that will surprise you and has bitten someone.
- Indonesian strings are quoted as they appear in the UI, with a translation on
  first use.
