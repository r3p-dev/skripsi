# Reconciliation — Technical

## Routes

| Method | URL                             | Controller                    | Route name                    |
| ------ | ------------------------------- | ----------------------------- | ----------------------------- |
| GET    | `/admin/reconciliation`         | `admin.Reconciliation.index`  | `admin.reconciliation.index`  |
| POST   | `/admin/reconciliation/:number` | `admin.Reconciliation.update` | `admin.reconciliation.update` |

## Files

| Concern    | Path                                                                                                                 |
| ---------- | -------------------------------------------------------------------------------------------------------------------- |
| Controller | [app/controllers/admin/reconciliation_controller.ts](../../../../app/controllers/admin/reconciliation_controller.ts) |
| Service    | [app/services/transaction_service.ts](../../../../app/services/transaction_service.ts)                               |
| Validator  | `reconciliationValidator` in [admin_validator.ts](../../../../app/validators/admin_validator.ts)                     |

## The list

```ts
const orders = await this.orderService.listForAdmin({
  ...filters,
  status: OrderStatus.AWAITING_PAYMENT, // hardcoded
  type: '',
})
```

It reuses `listForAdmin`, so it inherits the same search behaviour, trigram
index support, transactions preload, and page size of 15. **`status` is fixed and
`type` is blanked** — only `search` and `page` come from the request.

The page also receives `paymentMethodOptions` built from the `PaymentMethod`
enum.

## Validator

```ts
export const reconciliationValidator = vine.create({
  paymentMethod: vine.enum(Object.values(PaymentMethod)),
  note: vine.string().trim().minLength(5).maxLength(255),
})
```

The 5-character minimum is what stops a note of `"ok"`.

## Confirming

```ts
async update({ params, request, response, session }) {
  const payload = await request.validateUsing(reconciliationValidator)
  const order = await this.orderService.findForAdmin(params.number)

  await this.transactionService.confirmManualPayment(order, payload.paymentMethod, payload.note)

  session.flash('success', `Pesanan ${order.orderNumber} ditandai lunas.`)
  return response.redirect().toRoute('admin.reconciliation.index')
}
```

```ts
async confirmManualPayment(order, paymentMethod, note) {
  this.#assertPayable(order)

  const pending = await this.getPendingTransaction(order)

  const transaction = await db.transaction(async (trx) => {
    if (pending) {
      pending.merge({ status: TransactionStatus.EXPIRED })
      await pending.useTransaction(trx).save()
    }

    const settled = await Transaction.create({
      orderId: order.id,
      paymentMethod,
      status: TransactionStatus.PAID,
      midtransOrderId: null,
      midtransTransactionId: null,
      qrCode: null,
      cashReceived: null,
    }, { client: trx })

    await this.orderService.transitionTo(order, OrderStatus.IN_CLEANING, trx)

    return settled
  })

  logger.info({ order: order.orderNumber, note }, 'Payment confirmed manually')

  this.broadcast(order, transaction)

  return transaction
}
```

Points worth noting:

- **`#assertPayable` runs first**, delegating to `orderService.canPay` — the
  order must be `awaiting_payment` with `totalPrice > 0`. This is what prevents
  violating `transactions_order_id_paid_unique`.
- **Expiring the pending row and creating the paid row are one transaction**, so
  a stale QRIS code cannot be paid afterwards.
- **Midtrans fields are `null`**, which is how a manual settlement is
  distinguishable from a gateway one.
- **`cashReceived` is `null`** even for `cash` — unlike counter orders, no change
  is computed here.
- `transitionTo` enforces `awaiting_payment → in_cleaning`.

## The note is not persisted

```ts
logger.info({ order: order.orderNumber, note }, 'Payment confirmed manually')
```

`transactions` has no `note` column
([migration](../../../../database/migrations/1781150476881_create_transactions_table.ts)).
The justification survives only in the application log — not queryable, not
shown on the order detail page. Persisting it would need a schema change.

## Effect on reporting

A manual settlement is a `paid` transaction like any other, so it counts toward:

- dashboard revenue (`#paidRevenue`)
- the revenue trend and report series
- `#reportByPaymentMethod`, under whichever method the admin chose

Choosing the method accurately therefore matters for the payment-mix breakdown
in [reports](../reports/).

## Edge cases

- **Double settlement is blocked** by `#assertPayable`, backed by the partial
  unique index.
- **A cash reconciliation records no `cashReceived`**, so `changeFor` returns
  `0`.
- **The list ignores the `type` filter** entirely.
- **`findForAdmin` is fully preloaded** — heavier than this action needs, but it
  supplies the flash message's order number.
- **Broadcast happens after commit**, so subscribers only see settled state.

→ One-minute version: [tldr.md](tldr.md)
→ Plain-language walkthrough: [guide.md](guide.md)
