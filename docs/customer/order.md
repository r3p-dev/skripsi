# Customer — Orders

Booking a pickup, watching it move, cancelling it, and printing the receipt.
This is the customer's half of the lifecycle described in
[order-lifecycle.md](../order-lifecycle.md).

**Code:** [`order_service.ts`](../../app/services/order_service.ts) ·
[`customer/order_controller.ts`](../../app/controllers/customer/order_controller.ts) ·
[`order_validator.ts`](../../app/validators/order_validator.ts) ·
pages under [`inertia/pages/customer/order/`](../../inertia/pages/customer/order/)

---

## 1. Booking a pickup

`GET /order` → `POST /orders`

The form is deliberately tiny: **a date**. Everything else is either already
known (the address) or not knowable yet (what is being cleaned, what it costs).

```
OrderController.create
  ├─ AddressService.getActiveAddress(user)     → the pickup address, or null
  └─ OrderService.getAvailableServices()       → the whole catalogue, for the price accordion
```

The catalogue is shown as a read-only price list grouped by category, so the
customer can estimate before booking — but **nothing is selected at booking
time**. Prices are set later, by staff, at inspection.

> **Why not let the customer pick services up front:** they cannot know. Whether
> a pair of shoes needs a deep clean or a premium suede treatment, and whether
> the midsole needs unyellowing, is a judgement made with the shoes in hand.
> A quote given at booking would be a guess that either has to be renegotiated
> or eaten. So the booking is a *promise to collect*, and the quote comes after
> inspection.

### Submit

```
OrderController.store
  └─ orderValidator                addressId (positive int), pickupDate (date → Luxon DateTime)
  └─ OrderService.createOnlineOrder(user, payload)
       1. verify the address belongs to this customer
       2. enforce the daily pickup capacity
       3. create the order with a unique number
  └─ flash "Pesanan berhasil dibuat!" → redirect customer.order.show
```

The date is submitted as `YYYY-MM-DD` computed in **local browser time**, not
`toISOString()`:

```ts
// customer/order/create.tsx
function toLocalDateString(date: Date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}
```

> **Why:** `toISOString()` converts to UTC. For an evening booking in
> Indonesia (UTC+7/+8) that shifts the date back a day — a customer picking
> Wednesday evening would book a Tuesday pickup. This is the same class of bug
> that `excelDate()` solves on the export side; see
> [admin/exports.md](../admin/exports.md).

The calendar disables dates before today. Nothing on the server rejects a past
date, so that rule is currently UI-only.

---

## 2. Daily pickup capacity

```ts
export const DAILY_PICKUP_LIMIT = 10
```

```ts
const scheduledPickups = await Order.query()
  .where('pickup_date', data.pickupDate.toFormat('yyyy-MM-dd'))
  .where('status', OrderStatus.PICKUP_SCHEDULED)

if (scheduledPickups.length >= DAILY_PICKUP_LIMIT) {
  throw E_VALIDATION_ERROR('pickupDate', 'Batas penjemputan per hari sudah penuh untuk tanggal ini.')
}
```

> **Why enforce at booking rather than warn later:** the constraint is physical —
> one van, a finite day. Discovering it when the van is already out means calling
> customers to apologise. Refusing the eleventh booking costs one message on a
> form.

Three consequences to know:

- **The count is scoped to `pickup_scheduled` only.** Once a staff member claims
  a stop the order becomes `in_pickup` and stops counting, freeing a slot for that
  day. That is intentional in spirit — a collected order no longer needs van
  capacity — but it does mean a day can serve more than 10 orders in total.
- **Cancelled orders free their slot**, since they leave `pickup_scheduled`.
- The check is a plain `SELECT` then `INSERT`, not a locked count. Two customers
  booking the eleventh slot in the same instant can both pass. At this volume
  that is acceptable; if it ever matters, this is where a transaction with
  `SELECT … FOR UPDATE` or a unique counter row would go.

The admin dashboard surfaces the same number as a forward-looking panel so a day
filling up is visible before customers start being refused — see
[admin/dashboard.md](../admin/dashboard.md).

---

## 3. What gets written

```ts
Order.create({
  userId:        user.id,
  customerName:  address.name,        // ← from the address, not the account
  customerPhone: address.phone,       // ←
  addressId:     address.id,
  orderNumber,                        // ORDYYMMDD-NNN
  pickupDate:    data.pickupDate,
  totalPrice:    null,                // ← unpriced until inspection
  type:          OrderType.ONLINE,
  status:        OrderStatus.PICKUP_SCHEDULED,
})
```

No `order_action` row is written at creation. The action log starts when staff
first touch the order.

Order-number generation and its collision retry are described in
[order-lifecycle.md §6](../order-lifecycle.md#6-order-numbers).

---

## 4. Order list

`GET /orders` → [`customer/order/index.tsx`](../../inertia/pages/customer/order/index.tsx)

```ts
// OrderService.getAllOrders — always scoped to the signed-in customer
Order.query()
  .if(user, (query) => query.where('user_id', user!.id))
  .andWhereILike('order_number', `${filters.search}%`)
  .preload('address', (query) => query.whereILike('name', term).orWhereILike('phone', term).orWhereILike('street', term))
  .orderBy('created_at', 'desc')
  .paginate(filters.page, 10)
```

Search is a **prefix** match (`term%`) on the order number — the customer is
typing a number they can see on a card, so prefix matching is what feels right
and it can use the index.

⚠️ **Gotcha:** the search term is also applied to the *preloaded address*. When
a search matches an order number but not the address fields, the order comes back
with `address: null` and the card renders without an address. Empty searches are
unaffected (`'%'` matches everything). The admin monitor's search is built
differently and does not have this quirk — see
[admin/order-monitor.md](../admin/order-monitor.md).

---

## 5. Order detail — the tracking screen

`GET /orders/:number` → [`customer/order/show.tsx`](../../inertia/pages/customer/order/show.tsx)

```ts
// OrderService.getOrderByNumber(orderNumber, user)
Order.query()
  .if(user, (q) => q.where('user_id', user!.id))    // ownership scope
  .where('order_number', orderNumber)
  .preload('address')
  .preload('items', (q) => q.preload('service').preload('item'))
  .preload('actions', (q) => q.preload('staff'))
  .preload('transactions')
  .firstOrFail()
```

Passing `user` is what makes someone else's order a **404 rather than a 403** —
the row simply is not in the result set. The same method is called *without*
`user` by staff and admin controllers, which is how one method serves all three
roles.

The page renders, in order:

| Section          | Built from                                                                             |
| ---------------- | -------------------------------------------------------------------------------------- |
| Status hero      | `order.status` (the Indonesian label)                                                   |
| Payment card     | only when status is `"Menunggu Pelunasan"`; links to the QR or starts a new charge      |
| Before & after   | `inspection` photo + `cleaning_done` photo, only when **both** exist                    |
| Progress photos  | `pickup`, `inspection`, `delivery` proof photos                                         |
| Dates            | created, plus the timestamp of each completion action that exists                       |
| Items            | `order_items`, each with its formatted price; total at the foot                         |
| Receipt link     | always                                                                                  |
| Cancel button    | always rendered, disabled when `canCancel` is false                                     |

The three milestones are matched **on their Indonesian labels**:

```ts
const ORDER_STEPS = [
  { actionLabel: 'Penjemputan Selesai', ... },
  { actionLabel: 'Inspeksi Selesai',    ... },
  { actionLabel: 'Pengantaran Selesai', ... },
]
```

⚠️ Renaming a value in `ActionNameLabel` breaks this page silently — the
timeline just stops finding its steps. See
[architecture.md §5.2](../architecture.md#52-transformers-translate-on-the-way-out).

Claim and release actions are excluded from the customer view by simply not
being in that list; the customer never sees that two staff members considered
their pickup.

### Live updates

The tracking page itself is **not** live — it reflects whatever was true when it
loaded. Only the payment page subscribes to Transmit. See
[payment.md](payment.md).

---

## 6. Cancelling

`PUT /orders/:number` → `OrderService.cancelOrder`

```ts
canCancel(order) {
  const pickupDate = order.pickupDate?.startOf('day')
  const today      = DateTime.now().startOf('day')

  return order.status === OrderStatus.PICKUP_SCHEDULED && !!pickupDate && pickupDate > today
}
```

Two conditions, both necessary:

- **status is still `pickup_scheduled`** — once a staff member claims the stop
  the order is `in_pickup` and someone is driving.
- **the pickup date is strictly in the future** — `>`, not `>=`. On the morning
  of the pickup day, cancellation is already closed.

> **Why close it a full day out:** the day's route is planned around the
> bookings. A cancellation at 9am on the day, when the van is already loaded and
> routed, costs a wasted trip. Making the cut-off midnight is a rule a customer
> can understand without being told the operational reason.

The button is **rendered disabled rather than hidden**, with the explanation
underneath ("Pesanan hanya dapat dibatalkan sebelum tanggal penjemputan"), so the
rule is visible instead of the control mysteriously vanishing. The service
re-checks it anyway.

Cancelling only sets `status = cancelled`. No action row, no refund path — an
order that can be cancelled was never paid for, because payment only becomes
possible after inspection.

---

## 7. Receipt

`GET /orders/:number/receipt` →
[`customer/order/receipt.tsx`](../../inertia/pages/customer/order/receipt.tsx)

Same `getOrderByNumber` read, rendered as a printable document: order number,
dates, customer and address, the itemised lines with their **frozen** prices, and
the total. There is no PDF generation — it is a page styled for the browser's
print dialog.

Because `order_items` carries a copied `name` and `price`, a receipt printed a
year later shows what was actually charged, even if the catalogue has moved on
since. That is the whole reason for the copy; see
[admin/catalogue.md](../admin/catalogue.md).

---

## 8. Where to change things

| To change…                          | Edit                                                                    |
| ----------------------------------- | ----------------------------------------------------------------------- |
| Daily capacity                      | `DAILY_PICKUP_LIMIT` in [`order_service.ts`](../../app/services/order_service.ts) — the dashboard reads the same constant |
| Cancellation window                 | `OrderService.canCancel`                                                 |
| Order number format                 | `OrderService.generateOrderNumber`                                       |
| List page size                      | `.paginate(filters.page, 10)` in `getAllOrders`                          |
| Which milestones the timeline shows | `ORDER_STEPS` in [`customer/order/show.tsx`](../../inertia/pages/customer/order/show.tsx) |
| Reject past pickup dates server-side| Add a rule to `orderValidator` (currently UI-only)                        |
