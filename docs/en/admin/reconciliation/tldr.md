# Reconciliation — TL;DR

Marking an order paid for money that arrived **outside** the app — a bank
transfer whose webhook never landed, or cash taken at the shop.

![Orders awaiting payment (status is pinned)](../../../assets/admin-reconciliation-index-desktop.png)

## The five things to know

1. **It is a filtered order list, pinned to `awaiting_payment`.** The status
   filter is hardcoded; only search and page are user-controlled.
2. **A written note is mandatory**, 5 to 255 characters. It is the audit trail.
3. **Confirming creates a `paid` transaction with no Midtrans fields** and moves
   the order to `in_cleaning` — same outcome as a QRIS payment.
4. **Any pending transaction is expired** in the same database transaction.
5. **It is guarded by `canPay`**, so it cannot double-settle an order.

## Routes at a glance

| Method | URL                             | Purpose                 |
| ------ | ------------------------------- | ----------------------- |
| GET    | `/admin/reconciliation`         | Orders awaiting payment |
| POST   | `/admin/reconciliation/:number` | Mark one paid           |

## Validator

```ts
reconciliationValidator = {
  paymentMethod: vine.enum(PaymentMethod), // cash | qris | debit
  note: vine.string().trim().minLength(5).maxLength(255),
}
```

## The gotcha

**The note is only written to the log, not to the transaction row.**

```ts
logger.info({ order: order.orderNumber, note }, 'Payment confirmed manually')
```

`transactions` has no note column. If you need to trace _why_ an order was
settled by hand, it is in the application log — not queryable from the database.

→ Plain-language walkthrough: [guide.md](guide.md)
→ Implementation detail: [technical.md](technical.md)
