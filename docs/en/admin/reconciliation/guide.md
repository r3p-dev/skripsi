# Reconciliation — Guide

Not every payment arrives through the app. This is how an admin records the ones
that did not.

## When it is needed

The normal path is QRIS: the customer scans, the payment gateway confirms, and
the order moves on by itself. No human involvement.

But money arrives other ways:

- The customer paid cash at the counter.
- They paid by card on a machine that is not connected to the app.
- They made a bank transfer and sent a screenshot.
- They paid by QRIS but the confirmation never reached the app.

In all of these the money is real, but the app has no way to know. Someone has
to say so.

## The screen

The reconciliation page lists **only orders awaiting payment**. That filter is
fixed — an admin cannot use this screen to browse other stages, because
confirming a payment on an order that is not awaiting one makes no sense.

The list is searchable and paginated in the same way as the main order list.

## Confirming a payment

For each order, the admin records two things:

**How it was paid** — cash, QRIS, or debit. This is what actually happened, so
the payment mix in reporting stays honest.

**A note explaining why** — required, between 5 and 255 characters. Something
like "transfer proof received" or "paid cash at counter, receipt 0142".

The note is mandatory on purpose. Manually marking an order paid is the one
place where money can be recorded without the payment gateway agreeing, so it
should never be possible to do it silently.

## What happens

Confirming does the same thing a successful QRIS payment does:

- A settled payment record is created for the order.
- Any half-finished QRIS attempt is marked expired, so a customer who later
  scans an old code does not pay twice.
- The order moves to **in cleaning** and enters the wash queue.
- The customer's page updates live.

From the order's point of view there is no difference between money that came
through the gateway and money confirmed by hand. Only the payment record
remembers which.

## Where the note goes

Worth knowing, because it is easy to assume otherwise: **the note is written to
the application log, not stored on the payment record.**

If you need to audit why an order was settled by hand, the log has it — with the
order number and the time. But you cannot query it from the database, and it
will not show up on the order detail page. If that becomes a real requirement it
needs a schema change.

## Safety

An order cannot be settled twice. The same check that governs customer payments
applies here: the order must be awaiting payment and must have a price. An
already-paid order is refused.

## Screenshots

Every state below is shown at three widths — desktop (1440px), tablet (834px) and mobile (430px). The hero above is the desktop view, which is how this role's screens are normally used.

**Orders awaiting payment (status is pinned)**

| Desktop                                                                                                         | Tablet                                                                                                        | Mobile                                                                                                        |
| --------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| ![Orders awaiting payment (status is pinned) — desktop](../../../assets/admin-reconciliation-index-desktop.png) | ![Orders awaiting payment (status is pinned) — tablet](../../../assets/admin-reconciliation-index-tablet.png) | ![Orders awaiting payment (status is pinned) — mobile](../../../assets/admin-reconciliation-index-mobile.png) |

**Confirming a payment — method plus a required note**

| Desktop                                                                                                                   | Tablet                                                                                                                  | Mobile                                                                                                                  |
| ------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| ![Confirming a payment — method plus a required note — desktop](../../../assets/admin-reconciliation-confirm-desktop.png) | ![Confirming a payment — method plus a required note — tablet](../../../assets/admin-reconciliation-confirm-tablet.png) | ![Confirming a payment — method plus a required note — mobile](../../../assets/admin-reconciliation-confirm-mobile.png) |

→ One-minute version: [tldr.md](tldr.md)
→ Implementation detail: [technical.md](technical.md)
