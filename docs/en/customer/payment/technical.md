# Payment — Technical

## Routes

| Method | URL                       | Controller                    | Auth     | Limiter          |
| ------ | ------------------------- | ----------------------------- | -------- | ---------------- |
| GET    | `/orders/:number/payment` | `customer.Transaction.show`   | customer | —                |
| POST   | `/orders/:number/payment` | `customer.Transaction.store`  | customer | `paymentLimiter` |
| POST   | `/transaction/callback`   | `webhooks.Transaction.update` | **none** | —                |

`paymentLimiter`: 15 requests / 5 minutes, block 5 minutes, keyed on user id.

The webhook sits outside every auth group — it is authenticated by **signature
verification**, not by session.

## Files

| Concern             | Path                                                                                                                 |
| ------------------- | -------------------------------------------------------------------------------------------------------------------- |
| Service             | [app/services/transaction_service.ts](../../../../app/services/transaction_service.ts)                               |
| Customer controller | [app/controllers/customer/transaction_controller.ts](../../../../app/controllers/customer/transaction_controller.ts) |
| Webhook             | [app/controllers/webhooks/transaction_controller.ts](../../../../app/controllers/webhooks/transaction_controller.ts) |
| Midtrans config     | `#config/midtrans`                                                                                                   |
| Enums               | [app/enums/transaction_enum.ts](../../../../app/enums/transaction_enum.ts)                                           |

## Data model

`transactions` ([migration](../../../../database/migrations/1781150476881_create_transactions_table.ts)):

| Column                    | Notes                                     |
| ------------------------- | ----------------------------------------- |
| `order_id`                | FK → orders, `ON DELETE CASCADE`, indexed |
| `payment_method`          | `cash` \| `qris` \| `debit`               |
| `midtrans_order_id`       | indexed; `{orderNumber}-{n}`              |
| `midtrans_transaction_id` | indexed                                   |
| `qr_code`                 | text, the QR image URL                    |
| `status`                  | indexed                                   |
| `cash_received`           | decimal, counter payments only            |

Two partial unique indexes:

```sql
CREATE UNIQUE INDEX transactions_order_id_pending_unique
  ON transactions (order_id) WHERE status = 'pending';

CREATE UNIQUE INDEX transactions_order_id_paid_unique
  ON transactions (order_id) WHERE status = 'paid';
```

The `paid` one matters for reporting: revenue sums `orders.total_price` across a
join to `transactions`, so a second settled row would double-count that order.
`countDistinct` protects the order _count_ but not the _sum_, so the invariant
lives in the schema.

## Starting a payment

```ts
async startPayment(order) {
  this.#assertPayable(order)
  const pending = await this.getPendingTransaction(order)
  if (pending && !this.#isStale(pending)) return pending
  const charge = await this.#charge(order)
  return db.transaction(async (trx) => {
    if (pending) await pending.merge({ status: EXPIRED }).useTransaction(trx).save()
    return Transaction.create({ ...charge, status: PENDING, paymentMethod: QRIS }, { client: trx })
  })
}
```

`#assertPayable` delegates to `orderService.canPay` and produces a different
message depending on whether the order is in `awaiting_payment` without a price
or simply not at that stage.

```ts
#isStale(t) {
  if (!t.qrCode) return true
  return t.createdAt.diffNow('minutes').minutes < -QR_LIFETIME_MINUTES  // 15
}
```

A pending transaction with no `qrCode` is always stale — that covers a charge
that half-succeeded.

`#nextMidtransOrderId` counts existing transactions and appends `n + 1`, giving
Midtrans a unique id per attempt while keeping the order number readable.

`#charge` wraps `core.charge(...)` with `payment_type: 'qris'`. Any thrown error
is logged and converted to `E_VALIDATION_ERROR` on `form` — the upstream failure
never surfaces as a 500.

## Webhook handling

```ts
async update({ request, response }) {
  const payload = request.body()
  if (!verifyNotificationSignature(payload)) return response.forbidden(...)
  await this.transactionService.handleNotification(payload)
  return response.ok({ message: 'OK' })
}
```

`handleNotification`:

1. Find the transaction by `midtrans_order_id`, preloading `order`. Unknown id →
   log a warning and return `200`.
2. `#resolveStatus(payload)`.
3. Return early if the status is unchanged, or if the transaction is already
   `paid` — **paid is terminal**, later callbacks cannot un-settle it.
4. Merge status and `midtransTransactionId`, save.
5. If now `paid`, `#settle(order)`.
6. `broadcast(order, transaction)`.

### Status mapping

```ts
NOTIFICATION_STATUSES = {
  capture: PAID,
  settlement: PAID,
  pending: PENDING,
  deny: FAILED,
  cancel: CANCELLED,
  expire: EXPIRED,
  failure: FAILED,
}
```

Unknown values fall back to `FAILED`. Then:

```ts
if (status === PAID && payload.fraud_status === 'challenge') return PENDING
```

A challenged capture is held, not settled.

### Settlement

```ts
async #settle(order) {
  if (order.status !== OrderStatus.AWAITING_PAYMENT) return
  await this.orderService.transitionTo(order, OrderStatus.IN_CLEANING)
}
```

Guarded so a replayed callback on an already-advanced order is a no-op.

## Manual confirmation

`confirmManualPayment(order, paymentMethod, note)` — used by
[admin/reconciliation](../../admin/reconciliation/):

1. `#assertPayable(order)`.
2. In a transaction: expire any pending row, create a `paid` transaction with no
   Midtrans fields, `transitionTo(IN_CLEANING)`.
3. Log at info with the note, then broadcast.

Because `#assertPayable` runs first, a second manual confirmation on an
already-settled order is rejected before it can violate the paid-unique index.

## Realtime

```ts
transmit.broadcast(`orders/${order.orderNumber}`, {
  transactionStatus: transaction.status,
  orderStatus: order.status,
})
```

Channel authorisation lives in [start/routes.ts](../../../../start/routes.ts).

## Edge cases

- **The webhook is the only settlement path for QRIS.** No polling, no
  browser-side confirmation.
- **`paid` is terminal** in `handleNotification`.
- **`getLatestTransaction`** orders pending-first
  (`case when status = 'pending' then 0 else 1 end`), then newest — so the page
  shows an open attempt over an older settled one.
- **`ON DELETE CASCADE`** means deleting an order takes its transactions with it.
- The payment page redirects back to the order with a flash when no transaction
  exists yet.

→ One-minute version: [tldr.md](tldr.md)
→ Plain-language walkthrough: [guide.md](guide.md)
