# Staff — Walk-in Orders (Pesanan Offline)

A customer arrives at the counter with a bag of shoes. No account, no booking, no
pickup. This is the second, much shorter path through the system.

**Code:** [`OrderService.createOfflineOrder`](../../app/services/order_service.ts) ·
[`staff/order_controller.ts`](../../app/controllers/staff/order_controller.ts) ·
[`staff/transaction_controller.ts`](../../app/controllers/staff/transaction_controller.ts) ·
[`offlineOrderValidator`](../../app/validators/order_validator.ts) ·
page [`staff/order/create.tsx`](../../inertia/pages/staff/order/create.tsx)

---

## 1. Why walk-ins are a first-class order type

They could have been left out of the system — write them in a notebook, the app
handles online orders only. They are not, for three reasons:

1. **Revenue.** Counter trade is real income. An order the system does not know
   about is income the reports cannot see, and the whole point of the dashboard
   is that the owner can answer "how are we doing" without a shoebox of receipts.
2. **The rack.** Once shoes are on the drying rack, nothing distinguishes a
   walk-in pair from a collected pair. They need an order number and a printable
   tag like everything else.
3. **The catalogue.** Pricing at the counter from the same live price list is what
   stops a customer being quoted one figure in the app and another at the door.

So a walk-in gets a real `orders` row, a real order number, real `order_items`
with frozen prices, and a real transaction. What it does not get is the first
half of the lifecycle.

---

## 2. What is different from an online order

| Aspect             | Online                                   | Walk-in (`offline`)                        |
| ------------------ | ---------------------------------------- | ------------------------------------------ |
| `user_id`          | the customer's account                   | **`null`** — there is no account            |
| `address_id`       | the pickup address                       | **`null`** — nothing to deliver to          |
| `customer_name/phone` | copied from the address               | typed by staff on the form                  |
| `pickup_date`      | chosen by the customer                   | `null`                                      |
| Starting status    | `pickup_scheduled`                       | **`in_cleaning`**                           |
| Priced             | at inspection, later                     | **at creation**, immediately                |
| Payment            | QRIS only, after inspection              | cash, debit **or** QRIS, on the spot        |
| Ends at            | `completed` after delivery               | `completed` when cleaning is done           |
| Customer can track | yes, in the app                          | **no** — no account to sign in with          |

`user_id` and `address_id` are nullable in the migration precisely to make this
work. `address_id` being null is also what makes the order finish at the counter
— see [cleaning.md §4.2](cleaning.md#42-the-branch).

---

## 3. The form

`GET /staff/orders/create` renders the same item-row component the inspection
screen uses ([`item_fields.tsx`](../../inertia/components/organisms/item_fields.tsx)),
plus customer details and a payment method.

```ts
export const offlineOrderValidator = vine.create({
  name:          name(),                              // ≤50 chars, letters/spaces/dashes
  phone:         phone(),                             // 08xxxxxxxxx
  totalItems:    vine.number(),                       // ⚠️ validated, never used
  items:         vine.array(item),                    // same item shape as inspection
  note:          note(),                              // optional counter note
  paymentMethod: vine.enum(['cash', 'qris', 'debit']),
})
```

⚠️ `totalItems` is accepted and ignored — `createOfflineOrder` derives everything
from `items.length`. Harmless, but do not trust it to mean anything.

The customer's phone is required even though there is no account: it is how staff
call when the shoes are ready.

> **Why reuse the inspection item component:** the counter *is* an inspection —
> staff are looking at the shoes while they type. Same fields, same service
> picker, same derived item type. One component means the two screens cannot
> drift apart in what they record.

---

## 4. Creation

```
POST /staff/orders
  └─ offlineOrderValidator
  └─ OrderService.createOfflineOrder(staff, payload)
  └─ QRIS?  → redirect staff.transaction.show   (present the QR)
     else   → flash "Pesanan offline berhasil dibuat." → staff.trip.index
```

```ts
async createOfflineOrder(staff, data) {
  const createdOrder = await this.createWithUniqueOrderNumber((orderNumber) =>
    db.transaction(async (trx) => {
      const order = await Order.create({
        userId: null,
        customerName: data.name,
        customerPhone: data.phone,
        orderNumber,
        type: OrderType.OFFLINE,
        status: OrderStatus.IN_CLEANING,
        totalPrice: null,
      }, { client: trx })

      const totalPrice = await this.taskService.createOrderItems(order, data.items, trx)

      await order.merge({ totalPrice }).useTransaction(trx).save()

      await OrderAction.create({
        orderId: order.id, staffId: staff.id,
        name: ActionName.OFFLINE_ORDER, photoPath: null, note: data.note ?? null,
      }, { client: trx })

      return order
    })
  )

  if (data.paymentMethod === PaymentMethod.QRIS) {
    await this.transactionService.createQrisTransaction(createdOrder)
  } else {
    await this.transactionService.createManualTransaction(createdOrder, data.paymentMethod)
  }

  return this.getOrderByNumber(createdOrder.orderNumber)
}
```

Four things worth noting.

### 4.1 Order, items, total and action are one transaction

Wrapped in the same `createWithUniqueOrderNumber` retry as online orders, so an
order-number collision retries the whole block rather than surfacing an error at
the counter with a customer waiting.

### 4.2 `total_price` is written in two steps

The order is created with `totalPrice: null`, then merged after `createOrderItems`
returns the sum — because the lines need an `order_id` to exist, and the total
comes from the lines. Both writes are inside the transaction, so no observer ever
sees the null.

### 4.3 Pricing is the *same* method as inspection

`taskService.createOrderItems` — identical frozen-price behaviour, identical line
naming, identical `(item × service)` fan-out. See
[inspection.md §5](inspection.md#5-pricing--createorderitems). A walk-in receipt
is built from exactly the same machinery as an online one.

### 4.4 Payment happens **outside** the transaction

Deliberately. A Midtrans charge is a network call to a third party; holding a
database transaction open across it would keep row locks for the duration of an
external request, and a failure there must not roll back an order the customer is
standing in front of.

The consequence: if the QRIS charge fails, the **order still exists**, unpaid, in
`in_cleaning`. That is recoverable — staff can retry from the payment screen —
and it is the right trade. Losing the order would be worse.

An `offline_order` action is written carrying the counter note, naming the staff
member. It is the walk-in's equivalent of the pickup/inspection audit rows.

---

## 5. Payment at the counter

`TransactionService` has two entry points, and this is the only feature that uses
both.

### Cash and debit — `createManualTransaction`

```ts
return Transaction.create({
  orderId: order.id,
  paymentMethod,                              // 'cash' | 'debit'
  midtransOrderId: null,
  midtransTransactionId: null,
  status: TransactionStatus.PAID,             // ← paid immediately
  qrCode: null,
})
```

No provider, no pending state. The money is physically in the drawer or through
the EDC machine before staff submit the form, so the record is created already
settled. There is nothing to confirm and nothing that can be lost in transit —
which is why walk-ins paid this way never appear in
[reconciliation](../admin/reconciliation.md).

### QRIS — `createQrisTransaction`

The same method the customer app uses. It is allowed because `in_cleaning` is in
`PAYABLE_STATUSES`:

```ts
const PAYABLE_STATUSES = [OrderStatus.AWAITING_PAYMENT, OrderStatus.IN_CLEANING]
```

> **That second entry exists for exactly this case.** A walk-in is already in
> `in_cleaning` when it is charged, so without it the counter could not take
> QRIS at all.

The controller then redirects to `staff.transaction.show`, which renders the
**shared** payment page
([`inertia/pages/order/payment.tsx`](../../inertia/pages/order/payment.tsx)) with
staff-flavoured back and retry routes — the same screen the customer sees, on the
staff member's phone, turned around for the customer to scan.

When Midtrans confirms, `handleNotification` marks the transaction paid and
**leaves the order alone**, because the status guard only advances an order that
is `awaiting_payment`:

```ts
if (status === PAID && transaction.order.status === OrderStatus.AWAITING_PAYMENT) { ...advance... }
```

A walk-in is already past that point. The payment is recorded; the wash was never
waiting on it.

⚠️ Nothing blocks a walk-in from being washed and completed before its QRIS
payment settles. The counter is trusted to not hand shoes back unpaid — the
system records rather than enforces here.

---

## 6. After creation

The order behaves like any other `in_cleaning` order:

- it appears in the **Pencucian** tab (with no "before" photo — it was never
  inspected)
- staff can print its rack tag at `/staff/orders/:number/tag`
- marking it washed sets `completed` directly, because `address_id` is null
- it shows in the admin monitor with the **Offline** badge, and in the dashboard's
  online-vs-offline split
- reports count it under "Tipe Pesanan → Offline"

The customer never sees any of it. There is no account, so there is no tracking
page, no receipt link, and no notification — the phone number on the order is how
staff reach them.

---

## 7. Where to change things

| To change…                                        | Edit                                                                  |
| ------------------------------------------------- | --------------------------------------------------------------------- |
| Payment methods offered at the counter            | `PaymentMethod` enum + `offlineOrderValidator`                        |
| Starting status for walk-ins                      | `createOfflineOrder` (and check `PAYABLE_STATUSES` still covers it)   |
| Let walk-ins be delivered                         | Capture an address and set `address_id`; `markCleaningDone` handles the rest |
| Attach a walk-in to an existing customer account  | Set `user_id`; the customer would then see it in their order list      |
| Require a proof photo at intake                   | `offlineOrderValidator` + `createOfflineOrder` (currently none)        |
