# Payment — Guide

How a customer settles their bill, and why it can only happen at one particular
point in the order's life.

## When payment becomes possible

Not at booking. Not while the courier is collecting.

Payment opens only once staff have inspected the goods and priced them. At that
moment the order enters **awaiting payment** and the customer gets a bill for the
first time.

Two conditions must hold: the order is in that stage, **and** the total is
greater than zero. An order sitting in awaiting-payment with no price yet — which
can happen briefly — cannot be paid, and says so.

## Paying

The customer opens the payment page and asks to pay. The app contacts Midtrans,
which returns a **QRIS code**. The customer scans it with any QRIS-capable
banking or e-wallet app.

The QR code is good for **15 minutes**.

If they come back later, one of two things happens:

- **The existing QR is still fresh** → they get the same one back.
- **It has gone stale** → the old attempt is marked expired and a new QR is
  generated.

They are never left staring at a dead code with no way forward.

## How the app knows they paid

This is the part that surprises people.

The app does not learn about the payment from the customer's browser. Their
phone talks to their bank, the bank talks to Midtrans, and **Midtrans calls the
app directly** on a dedicated webhook address.

That call is what marks the transaction paid. The customer's page is watching a
live channel for the order, so it updates by itself the moment the webhook lands
— usually within seconds.

The practical consequence: **do not treat "the customer says they paid" or "the
browser came back" as proof.** Only the webhook settles anything. If Midtrans is
slow, the page will honestly show pending for a little longer.

## What happens the moment it settles

When the payment is confirmed, the order moves straight from **awaiting
payment** to **in cleaning**. No one has to press anything. The goods enter the
wash queue and staff pick them up from there.

## When something goes wrong

Midtrans reports several outcomes, and the app maps each one:

| What happened               | Result    |
| --------------------------- | --------- |
| Payment captured or settled | **Paid**  |
| Still processing            | Pending   |
| Denied or failed            | Failed    |
| Cancelled                   | Cancelled |
| Timed out                   | Expired   |

There is one deliberate exception. If Midtrans reports a successful capture but
flags it as a **fraud challenge**, the app treats it as _pending_, not paid. The
money is not released and the order does not move on. It will look paid in the
Midtrans dashboard while the app says otherwise — that is intentional, and needs
a human to review it.

If the payment service is unreachable entirely, the customer gets a plain
"payment service is unavailable, please try again" message rather than an error
page.

## Paying another way

Not every payment comes through QRIS. Cash at the counter, a card, or a bank
transfer whose webhook never arrived all happen in real life.

For those, an admin marks the order paid by hand — see
[admin/reconciliation](../../admin/reconciliation/). The effect on the order is
identical: it moves to in-cleaning. The difference is that a manual settlement
carries a written note explaining where the money came from.

## Screenshots

Every state below is shown at three widths — desktop (1440px), tablet (834px) and mobile (430px). The hero above is the desktop view, which is how this role's screens are normally used.

**`pending` — QRIS code awaiting a scan**

| Desktop                                                                                                  | Tablet                                                                                                 | Mobile                                                                                                 |
| -------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------ |
| ![`pending` — QRIS code awaiting a scan — desktop](../../../assets/customer-payment-pending-desktop.png) | ![`pending` — QRIS code awaiting a scan — tablet](../../../assets/customer-payment-pending-tablet.png) | ![`pending` — QRIS code awaiting a scan — mobile](../../../assets/customer-payment-pending-mobile.png) |

**`paid` — settled, order moved to cleaning**

| Desktop                                                                                                   | Tablet                                                                                                  | Mobile                                                                                                  |
| --------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| ![`paid` — settled, order moved to cleaning — desktop](../../../assets/customer-payment-paid-desktop.png) | ![`paid` — settled, order moved to cleaning — tablet](../../../assets/customer-payment-paid-tablet.png) | ![`paid` — settled, order moved to cleaning — mobile](../../../assets/customer-payment-paid-mobile.png) |

**`expired` — the QR window lapsed**

| Desktop                                                                                             | Tablet                                                                                            | Mobile                                                                                            |
| --------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| ![`expired` — the QR window lapsed — desktop](../../../assets/customer-payment-expired-desktop.png) | ![`expired` — the QR window lapsed — tablet](../../../assets/customer-payment-expired-tablet.png) | ![`expired` — the QR window lapsed — mobile](../../../assets/customer-payment-expired-mobile.png) |

→ One-minute version: [tldr.md](tldr.md)
→ Implementation detail: [technical.md](technical.md)
