# Counter Orders — TL;DR

A walk-in customer standing at the shop. Goods, price, and money all land in
**one submission** — so the order is born already paid.

![Counter order form — goods, payment, photo in one](../../../assets/staff-counter-orders-create-mobile.png)

## The five things to know

1. **Counter orders skip four stages.** They start at `in_cleaning`, not
   `pickup_scheduled` — no pickup, no inspection, no awaiting-payment.
2. **They are created already paid.** A `paid` transaction is written in the same
   transaction as the order.
3. **An account is optional; delivery requires one.** `customerId` is optional,
   but asking for delivery without a customer who has a saved address is a
   validation error.
4. **Two order types.** `offline` (collect at shop) or `walk_in_delivery` (has an
   address).
5. **Cash payments require `cashReceived`**, enforced by
   `requiredWhen('paymentMethod', '=', 'cash')`.

## Routes at a glance

| Method | URL                             | Purpose                               |
| ------ | ------------------------------- | ------------------------------------- |
| GET    | `/staff/orders/create`          | Counter order form                    |
| POST   | `/staff/orders`                 | Create it — goods + payment in one go |
| GET    | `/staff/orders/:number/edit`    | Correct the goods                     |
| PUT    | `/staff/orders/:number`         | Save corrections (re-prices)          |
| GET    | `/staff/orders/:number/receipt` | Receipt, with change due              |
| GET    | `/staff/customers`              | Customer autocomplete (JSON)          |

## The gotcha

**Item corrections only work while the order is `awaiting_payment`.** But a
counter order is created at `in_cleaning`, already paid — so the edit screen
does **not** apply to counter orders in practice. It exists for online orders
that have been inspected but not yet paid.

Second gotcha: **customer search needs 3+ characters** and silently returns an
empty array below that.

→ Plain-language walkthrough: [guide.md](guide.md)
→ Implementation detail: [technical.md](technical.md)
