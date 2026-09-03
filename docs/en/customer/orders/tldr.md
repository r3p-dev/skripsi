# Orders — TL;DR

The customer books a pickup, lists what they are sending, and tracks it. **The
price is not known at booking time** — it is set later, by staff, after physical
inspection.

![Order history](../../../assets/customer-orders-index-desktop.png)

## The five things to know

1. **You need a saved address before you can order.** No address, no order — it
   fails on the `form` field.
2. **Pickup must be a future date**, and each date has a hard cap of
   **10 scheduled pickups** (`DAILY_PICKUP_LIMIT`).
3. **Between 1 and 10 items per order** (`MAX_ITEMS_PER_ORDER`).
4. **`totalPrice` starts `null`.** It is filled during inspection. A price of
   `null` is not a bug, it means "not yet inspected".
5. **Cancelling is only possible before the pickup date**, and only while the
   status is still `pickup_scheduled`.

## Routes at a glance

| Method | URL                       | Purpose                    |
| ------ | ------------------------- | -------------------------- |
| GET    | `/orders`                 | List the customer's orders |
| GET    | `/orders/create`          | Booking form               |
| POST   | `/orders`                 | Create the order           |
| GET    | `/orders/:number`         | Track one order            |
| PUT    | `/orders/:number`         | Cancel it                  |
| GET    | `/orders/:number/receipt` | Printable receipt          |

Orders are addressed by **order number** (e.g. `ORD2608-0496`), never by
database id.

## The gotcha

**Cancelling is a `PUT` to the order, not a `DELETE`.** The resource route
excludes `edit` and `destroy`, so `update` is repurposed as "cancel". Nothing is
ever deleted — the order moves to `cancelled` and stays in history.

Second gotcha: **the daily pickup cap counts only orders still in
`pickup_scheduled`.** Once a pickup is collected, that slot frees up, so the cap
is "10 waiting", not "10 booked ever".

→ Plain-language walkthrough: [guide.md](guide.md)
→ Implementation detail: [technical.md](technical.md)
