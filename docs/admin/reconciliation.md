# Admin — Payment Reconciliation

The single most sensitive action in the product: asserting that money changed
hands when the payment provider never said so. Read the whole document before
touching this code.

**Code:** [`reconciliation_service.ts`](../../app/services/reconciliation_service.ts) ·
[`admin/reconciliation_controller.ts`](../../app/controllers/admin/reconciliation_controller.ts) ·
[`reconciliation_validator.ts`](../../app/validators/reconciliation_validator.ts) ·
page [`admin/reconciliation/index.tsx`](../../inertia/pages/admin/reconciliation/index.tsx)

---

## 1. The problem it exists to solve

An online order is priced at inspection and sits in `awaiting_payment`. The
customer scans the QR and pays. Midtrans confirms by calling our webhook.

**If that call never arrives**, nothing else in the system can move the order on:

- The **customer** cannot mark their own order paid — obviously.
- **Staff** have no tool for it; nothing in the staff app touches payment state.
- The **webhook** is the only automatic path, and it is the thing that failed.

The order sits in `awaiting_payment` forever, the shoes are unwashed, and the
customer is out of pocket. Causes are mundane: the tunnel was down during
development, a deploy happened mid-notification, the callback URL was wrong,
Midtrans' retries all landed during an outage.

This screen is the only way out.

> **Why it is admin-only:** overriding a payment state should be rare,
> deliberate, and attributable to a person. Giving it to staff would put "mark it
> paid" one tap away from the busiest, most distracted users in the system.

---

## 2. The backlog

```ts
private stuckOrdersQuery(filters: Filters) {
  const searchTerm = `${filters.search}%`

  return Order.query()
    .where('status', OrderStatus.AWAITING_PAYMENT)
    .if(filters.search, (query) => query.where((matches) =>
      matches.whereILike('order_number', searchTerm).orWhereILike('customer_name', searchTerm)))
    .preload('transactions', (q) => q.orderBy('created_at', 'desc'))
    .preload('user')
    .orderBy('created_at', 'asc')          // ← oldest first
}
```

**Every order in `awaiting_payment` appears here**, not only ones with a failed
transaction. There is no way to distinguish "the callback was lost" from "the
customer hasn't paid yet" — both look identical from our side. The screen shows
the whole set and lets a human decide.

**Oldest first**, unlike every other admin list.

> **Why:** the longer an order has sat there, the more likely it is a lost
> callback rather than a customer who simply has not paid yet. Sorting oldest
> first puts the probable problems at the top.

Transactions are preloaded newest-first so each row can show the last charge's
status (`Tertunda`, `Kedaluarsa`, `Gagal`, or "Belum ditagih" if there is none at
all) and its Midtrans reference.

---

## 3. Confirming a payment

`PUT /admin/reconciliations/:number`

```ts
export const reconciliationValidator = vine.create({
  paymentMethod: vine.enum(Object.values(PaymentMethod)),
  note: vine.string().trim().minLength(5).maxLength(255),      // ← required
})
```

> **The note is required, not optional.** This is the one action in the product
> that asserts money changed hands on nothing but an admin's word, and the record
> of it is worthless if it does not say why. Five characters is a low bar, but it
> is a bar — you cannot submit an empty reason.

The payment method is asked for because the admin usually knows *how* the money
actually arrived: a bank transfer they can see on the statement, cash handed over
at the shop, or a QRIS payment Midtrans took but never reported.

### The service

```ts
async confirmPayment(admin: User, orderNumber: string, data: ReconciliationData): Promise<Order> {
  const order = await Order.query().where('order_number', orderNumber).preload('transactions').firstOrFail()

  if (order.status !== OrderStatus.AWAITING_PAYMENT) {
    throw E_VALIDATION_ERROR('status', 'Pesanan ini tidak sedang menunggu pelunasan.')
  }

  const pending = order.transactions.find((t) => t.status === TransactionStatus.PENDING)

  await db.transaction(async (trx) => {
    if (pending) {
      await pending.merge({ status: TransactionStatus.PAID, paymentMethod: data.paymentMethod }).useTransaction(trx).save()
    } else {
      await Transaction.create({
        orderId: order.id, paymentMethod: data.paymentMethod,
        midtransOrderId: null, midtransTransactionId: null,
        status: TransactionStatus.PAID, qrCode: null,
      }, { client: trx })
    }

    await OrderAction.create({
      orderId: order.id, staffId: admin.id,
      name: ActionName.PAYMENT_OVERRIDE, photoPath: null, note: data.note,
    }, { client: trx })

    await order.merge({ status: OrderStatus.IN_CLEANING }).useTransaction(trx).save()
  })

  transmit.broadcast(`orders/${order.orderNumber}`, {
    transactionStatusLabel: TransactionStatusLabel[TransactionStatus.PAID],
    orderStatusLabel:       OrderStatusLabel[OrderStatus.IN_CLEANING],
  })

  return order
}
```

Five things happen, and each is deliberate.

### 3.1 The status guard

Only `awaiting_payment` can be reconciled. An order already in cleaning has been
paid; an order still in inspection has no price. This makes the action idempotent
in practice — clicking twice, or two admins acting at once, means the second
attempt fails cleanly with *"Pesanan ini tidak sedang menunggu pelunasan."*

### 3.2 Settle the existing pending row, don't add a second

```ts
const pending = order.transactions.find((t) => t.status === TransactionStatus.PENDING)
```

> **Why:** if the customer really did scan the QR, that pending row **is** the
> payment. Marking it paid means the Midtrans reference on the row is the one
> that matches the bank statement. Creating a second row beside it would leave
> the shop with two records of one payment and a Midtrans reference attached to
> the wrong one.

The `paymentMethod` on that row is overwritten with what the admin selected,
because the money may genuinely have arrived a different way than the abandoned
QR suggests.

An order that was never charged (no pending row) gets a fresh transaction with
null Midtrans identifiers — that null is itself the marker that no provider was
involved.

### 3.3 The audit trail

```ts
name: ActionName.PAYMENT_OVERRIDE,   // "Pembayaran Dikonfirmasi Manual"
staffId: admin.id,
note: data.note,
```

Written into the same `order_actions` table as every staff action, so it appears
in the order's history on the [admin order detail](order-monitor.md) page,
permanently, naming the admin and their reason. There is no delete path for
`order_actions` anywhere in the codebase.

Note the column is `staff_id` even for an admin — it means "the user who
performed this action", and predates admins performing any.

### 3.4 The order advances

Straight to `in_cleaning`, exactly where the webhook would have put it. From
there the order is indistinguishable from one that paid normally, which is the
point: reconciliation repairs the flow rather than creating a parallel one.

### 3.5 The broadcast

The **same Transmit payload the webhook sends**, so a customer still sitting on
the QR screen watching for confirmation sees the order move on rather than
waiting on a code that will never be scanned. Sent outside the transaction, so a
listener can never be told about a state that then rolls back.

---

## 4. The export

`GET /admin/reconciliations/export` — the whole backlog, not the current page.

> **Why the file is the point of the feature, not a nice-to-have:** the way an
> admin actually resolves these is to sit down with a bank statement and check
> off which payments really did arrive. That is not a thing you do ten rows at a
> time in a browser.

Columns lead with the two things the decision turns on:

`Nomor · Pelanggan · Telepon · **Menunggu Sejak** · **Status Transaksi** ·
Metode Pembayaran · Referensi Midtrans · Total`

"Menunggu Sejak" is `created_at` — how long it has been stuck. "Referensi
Midtrans" is the `midtrans_order_id`, which is what you search for in the Midtrans
dashboard.

---

## 5. Operational guidance

**Before confirming, verify externally.** The system cannot tell you whether the
money arrived. Check the Midtrans dashboard for the reference, or the bank
statement, or the cash drawer. This screen records a decision; it does not make
one.

**The note should say what you checked**, not what you did — "Dana masuk di
rekening BCA 12 Juli, ref MT-8891" is useful in six months; "sudah bayar" is not.

**There is no undo.** No route un-reconciles an order. The transaction is paid,
the order is in cleaning, and the override is in the log. Reversing it means
manual database work, and the `payment_override` action stays regardless.

**Watch for the real cause.** A steady trickle of reconciliations means the
webhook is unreliable — check the callback URL in the Midtrans dashboard against
`{APP_URL}/transaction/callback`, and check that the endpoint is publicly
reachable. Reconciliation is a repair tool, not a payment method.

---

## 6. Where to change things

| To change…                              | Edit                                                                       |
| --------------------------------------- | -------------------------------------------------------------------------- |
| Minimum note length                     | [`reconciliation_validator.ts`](../../app/validators/reconciliation_validator.ts) |
| Which orders appear                     | `stuckOrdersQuery`                                                          |
| Add an "un-reconcile" path              | Would need a new action name, a status guard, and a policy decision about the paid transaction |
| Let staff reconcile                     | Don't. If you must, at minimum keep the required note and the `payment_override` log |
