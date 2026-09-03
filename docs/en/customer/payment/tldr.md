# Payment — TL;DR

The customer pays by **QRIS through Midtrans**, and only once the order has been
inspected and priced.

![`pending` — QRIS code awaiting a scan](../../../assets/customer-payment-pending-desktop.png)

## The five things to know

1. **You can only pay in `awaiting_payment`, and only if `totalPrice > 0`.**
   That is `canPay()`, checked server-side every time.
2. **The QR code expires after 15 minutes.** Asking to pay again reuses a fresh
   pending transaction, or expires the stale one and charges again.
3. **Payment is confirmed by webhook, not by the browser.** Midtrans calls
   `POST /transaction/callback`; the customer's page updates over SSE.
4. **Paying moves the order to `in_cleaning` automatically.** That is `#settle`.
5. **One settled transaction per order**, enforced by a partial unique index
   `transactions_order_id_paid_unique`.

## Routes at a glance

| Method | URL                       | Purpose                                       |
| ------ | ------------------------- | --------------------------------------------- |
| GET    | `/orders/:number/payment` | Show the QR / payment state                   |
| POST   | `/orders/:number/payment` | Start or refresh a payment                    |
| POST   | `/transaction/callback`   | Midtrans webhook (no auth, signature-checked) |

## Statuses

`pending` · `paid` · `expired` · `cancelled` · `failed`

## The gotcha

**The webhook is the source of truth, not the redirect.** A customer can scan,
pay, and be looking at a "pending" screen for a moment until Midtrans calls
back. Never infer success from the browser returning.

Second gotcha: **a Midtrans `capture` with `fraud_status: 'challenge'` is
downgraded to `pending`**, not treated as paid. It looks like a successful
payment in the Midtrans dashboard but deliberately does not settle the order.

→ Plain-language walkthrough: [guide.md](guide.md)
→ Implementation detail: [technical.md](technical.md)
