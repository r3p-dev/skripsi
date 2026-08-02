# Customer — Payment

QRIS through Midtrans, a webhook that moves the order on by itself, and a page
that updates without refreshing. This is the only place money enters the system
from outside the shop.

**Code:** [`transaction_service.ts`](../../app/services/transaction_service.ts) ·
[`config/midtrans.ts`](../../config/midtrans.ts) ·
[`customer/transaction_controller.ts`](../../app/controllers/customer/transaction_controller.ts) ·
[`webhooks/transaction_controller.ts`](../../app/controllers/webhooks/transaction_controller.ts) ·
page [`order/payment.tsx`](../../inertia/pages/order/payment.tsx)

---

## 1. When payment becomes possible

An online order becomes payable when inspection sets its price and moves it to
`awaiting_payment`. `TransactionService` guards this with:

```ts
const PAYABLE_STATUSES = [OrderStatus.AWAITING_PAYMENT, OrderStatus.IN_CLEANING]
```

`in_cleaning` is in the list for **walk-in orders**, which are created directly
in that status and paid at the counter — see
[staff/walk-in-order.md](../staff/walk-in-order.md). For a customer, only
`awaiting_payment` is reachable.

Anything else is refused:

```ts
if (!PAYABLE_STATUSES.includes(order.status) || !order.totalPrice) {
  throw E_VALIDATION_ERROR('status', 'Pesanan ini tidak memerlukan pembayaran saat ini.')
}
```

The `!order.totalPrice` half matters: charging Midtrans zero, or `null`, is not a
recoverable error at the provider.

---

## 2. Creating the charge

`POST /orders/:number/transactions` → `TransactionService.createQrisTransaction`

```
1. guard: payable status + a total price
2. reuse: is there already a PENDING transaction for this order?  → return it, stop
3. meter: consume the midtransCharge limiter for this order id
4. charge: Midtrans Core API, payment_type 'qris', acquirer 'gopay'
5. store: a transactions row with the QR image URL
```

### Step 2 — reuse before charging

```ts
const pending = await Transaction.query()
  .where('orderId', order.id).where('status', TransactionStatus.PENDING).first()

if (pending) return pending
```

> **Why:** the customer taps "pay", closes the app, comes back and taps again.
> Without this, every tap would create a second live QR at Midtrans for the same
> order — two codes that could each be scanned, and a reconciliation problem
> nobody wants. The database backs the same rule with a partial unique index:
> `transactions_order_id_pending_unique … WHERE status = 'pending'`.

### Step 3 — the rate limiter sits *inside* the service

```ts
await midtransChargeLimiter.consume(`midtrans_charge:${order.id}`)   // 5 per 15 min, keyed on the order
```

> **Why not on the route:** most "pay" requests never reach Midtrans because
> step 2 returned the existing QR. Metering the route would count those, and a
> customer refreshing their payment screen would lock themselves out of a
> payment they have not yet made. Metering the *charge* counts only genuinely new
> ones, leaving room for legitimate retries after expiry while stopping a loop
> from hammering the provider.

Exceeding it surfaces as a validation error:
*"Terlalu banyak percobaan pembayaran. Silakan coba lagi nanti."*

### Step 4 — the charge

```ts
const midtransOrderId = `${order.orderNumber}-${Date.now()}`

const response = await core.charge({
  payment_type: 'qris',
  transaction_details: { order_id: midtransOrderId, gross_amount: order.totalPrice },
  qris: { acquirer: 'gopay' },
})
```

> **Why the timestamp suffix:** Midtrans requires a globally unique `order_id`
> per charge. Our order number is not enough — after a QR expires, the same
> order must be chargeable again. `ORD260728-001-1753689600000` is unique per
> attempt while remaining greppable back to the order.

This is the **Core API**, not Snap: no redirect, no popup, no hosted page. The
app receives a QR image URL and renders it itself, so the payment screen stays
inside our UI on a phone.

The QR URL is dug out of the response's `actions` array:

```ts
const qrCode = response.actions?.find((action) => action.name === 'generate-qr-code')?.url
```

⚠️ If Midtrans changes that action name, `qrCode` becomes `null`, the transaction
row is still created, and the page renders "QR tidak tersedia" rather than
failing — a silent degradation worth knowing about.

Sandbox vs. production is chosen by `NODE_ENV === 'production'` in
[`config/midtrans.ts`](../../config/midtrans.ts).

---

## 3. The payment page

`GET /orders/:number/transactions/latest` renders
[`inertia/pages/order/payment.tsx`](../../inertia/pages/order/payment.tsx) — a
page **shared with staff**, which is why it takes `backRoute` and `retryRoute`
props instead of hard-coding links:

| Caller                          | `backRoute`             | `retryRoute`                 |
| ------------------------------- | ----------------------- | ---------------------------- |
| `customer.transaction.show`     | `customer.order.show`   | `customer.transaction.store` |
| `staff.transaction.show`        | `staff.trip.index`      | `staff.transaction.store`    |

> **Why share it:** a staff member handing a phone across the counter for a QRIS
> walk-in needs exactly the same screen. Duplicating it would guarantee the two
> drift apart.

If the order has no transaction at all, the controller flashes
*"Belum ada transaksi untuk pesanan ini."* and redirects back.

### Three visual states, keyed off the transaction status

| Status label | Screen                                                        |
| ------------ | ------------------------------------------------------------- |
| `Tertunda`   | the QR image + "Menunggu pembayaran…" + a live subscription    |
| `Terbayar`   | a success card and a link back to the order                    |
| anything else| "Kode QR sudah tidak berlaku" + a **Buat Pembayaran Baru** button |

The retry button posts to `transaction.store` again, which — because the old row
is no longer `pending` — falls through the reuse check and issues a fresh charge.

⚠️ Note the page compares against the **Indonesian labels** (`'Terbayar'`,
`'Tertunda'`) produced by `TransactionTransformer`, not the raw enum. The raw
value is available as `statusValue`; prefer it in new code.

### Live updates

```ts
// only while pending
const transmit     = new Transmit({ baseUrl: window.location.origin })
const subscription = transmit.subscription(`orders/${order.orderNumber}`)

subscription.create().then(() => {
  subscription.onMessage(({ transactionStatusLabel }) =>
    setTransaction((current) => ({ ...current, status: transactionStatusLabel }))
  )
})
```

Server-sent events via `@adonisjs/transmit`. Channel authorisation is in
[`start/routes.ts`](../../start/routes.ts): staff may subscribe to any order,
a customer only to their own. The subscription is torn down when the transaction
stops being pending, and on unmount.

> **Why live at all:** the customer is standing there with a banking app open.
> Telling them to refresh to find out whether their payment landed is the single
> most frustrating moment in the flow. Two lines of SSE remove it.

---

## 4. The webhook — how an order pays for itself

`POST /transaction/callback` — **public**, registered before every auth group.

```ts
// webhooks/transaction_controller.ts
if (!verifyNotificationSignature(payload)) return response.forbidden({ message: 'Invalid signature' })
await this.transactionService.handleNotification(payload)
return response.ok({ message: 'OK' })
```

Authenticity is proven by the payload signature, not a session — Midtrans calls
this endpoint directly:

```ts
sha512(order_id + status_code + gross_amount + serverKey) === payload.signature_key
```

Because the server key is a secret only we and Midtrans hold, a forged
notification cannot produce a matching digest. **This check is the only thing
standing between the internet and free shoe cleaning** — never weaken it, never
short-circuit it in tests against production keys.

### Handling

```ts
const transaction = await Transaction.query().where('midtransOrderId', payload.order_id).preload('order').first()
if (!transaction) return                        // unknown reference: ignore quietly

const status = this.resolveStatus(payload)

await db.transaction(async (trx) => {
  await transaction.merge({ status, midtransTransactionId: payload.transaction_id }).useTransaction(trx).save()

  if (status === TransactionStatus.PAID && transaction.order.status === OrderStatus.AWAITING_PAYMENT) {
    await transaction.order.merge({ status: OrderStatus.IN_CLEANING }).useTransaction(trx).save()
  }
})

transmit.broadcast(`orders/${transaction.order.orderNumber}`, {
  transactionStatusLabel: TransactionStatusLabel[status],
  orderStatusLabel:       OrderStatusLabel[transaction.order.status],
})
```

Points to note:

- **Status mapping** (`resolveStatus`) translates Midtrans' vocabulary into ours:

  | Midtrans                        | Ours       |
  | ------------------------------- | ---------- |
  | `capture` + `fraud_status=accept` | `paid`   |
  | `capture` + anything else       | `failed`   |
  | `settlement`                    | `paid`     |
  | `pending`                       | `pending`  |
  | `expire`                        | `expired`  |
  | anything else                   | `failed`   |

- **The order only advances from `awaiting_payment`.** A walk-in already in
  `in_cleaning` gets its transaction marked paid and nothing else — no accidental
  double-advance.
- **Idempotent enough.** Midtrans retries notifications. A repeat of the same
  payload re-writes the same status and finds the order no longer in
  `awaiting_payment`, so it changes nothing. It does re-broadcast, which is
  harmless.
- **Unknown `order_id` is ignored silently** — sandbox traffic and stale
  references should not 500.
- **The broadcast is outside the transaction**, so a listener can never be told
  about a state that then rolls back.

---

## 5. When the webhook never arrives

This is the failure the product plans for explicitly. If Midtrans' call is lost —
tunnel down, deploy in progress, misconfigured URL — the customer has paid and
the order sits in `awaiting_payment` forever. The customer cannot mark their own
order paid, and staff have no tool for it.

The only way out is the admin reconciliation screen, which settles the payment by
hand, records who did it and why, and broadcasts the **same Transmit payload** so
a customer still sitting on the QR screen sees it clear. See
[admin/reconciliation.md](../admin/reconciliation.md).

---

## 6. What is *not* here

- **No refunds.** No status, no endpoint, no UI. A refund is handled outside the
  system.
- **No partial payments.** One order, one amount.
- **No payment before inspection.** The total does not exist yet.
- **No card, VA, or e-wallet redirect.** QRIS only for customers; cash and debit
  exist only as counter methods recorded by staff.

---

## 7. Where to change things

| To change…                       | Edit                                                                     |
| -------------------------------- | ------------------------------------------------------------------------ |
| Acquirer (`gopay`)               | `createQrisTransaction` in [`transaction_service.ts`](../../app/services/transaction_service.ts) |
| Charge retry allowance           | `midtransChargeLimiter` in [`start/limiter.ts`](../../start/limiter.ts)  |
| Which statuses may be charged    | `PAYABLE_STATUSES`                                                       |
| Midtrans status mapping          | `TransactionService.resolveStatus`                                        |
| Webhook URL                      | Midtrans dashboard → `POST {APP_URL}/transaction/callback`               |
| Sandbox / production             | `NODE_ENV` (see [`config/midtrans.ts`](../../config/midtrans.ts))        |
