# Orders — Guide

This is the customer's side of an order: booking it, watching it progress, and
getting a receipt at the end.

## Before you can order

The customer needs a saved [address](../address/). The order takes its pickup
location, recipient name, and contact phone **from the address**, not from the
order form — so without one there is nothing to pick up from.

Trying to order without an address gives a message asking them to add one first.

## Booking a pickup

The form asks for two things: **when** and **what**.

**When** — a pickup date, which must be in the future. Same-day booking is not
allowed.

Each date has a capacity of **10 pickups**. If ten customers have already booked
that day, the date is refused and they are asked to pick another. The message
appears on the pickup-date field.

Worth understanding: the cap counts orders _still waiting to be collected_. Once
a courier actually picks an order up, its status moves on and the slot is freed.
So the limit is really "ten pickups outstanding on that date", which in practice
matches how many runs the team can do.

**What** — a list of items, between one and ten. For each item the customer
describes:

- Type: shoe, bag, or helmet
- Brand, model, size, material
- An optional note

Note what is _not_ asked for: the service. The customer does not choose "deep
clean" or "repair" — they describe the object, and staff decide what treatment
it needs when they physically inspect it.

## Why there is no price yet

This is the single most important thing to understand about this app.

At booking, the order has **no price at all**. `totalPrice` is empty. That is not
a missing feature — you cannot quote a shoe clean without seeing the shoe.

The price appears after the pickup, when staff inspect the goods and match each
item to catalogue services. Only then does the order have a bill, and only then
can the customer pay.

So the customer's experience is: book → wait → get collected → **receive a
price** → pay → get it back.

## Tracking

The order page shows the current stage. The lifecycle is:

1. **Pickup scheduled** — booked, waiting for a courier
2. **In pickup** — collected, on the way to the shop
3. **In inspection** — being examined and priced
4. **Awaiting payment** — priced, waiting for the customer to pay
5. **In cleaning** — paid, being worked on
6. Then either **in delivery** (if they have an address) or **ready for
   collection** (if not)
7. **Completed**

The page updates live as staff move the order along — no refresh needed.

## Cancelling

An order can be cancelled only while it is still **pickup scheduled** and only
**before the pickup date arrives**. On or after the pickup day, the cancel option
is gone — a courier may already be en route.

Cancelling does not erase anything. The order stays in the list marked
cancelled.

## The receipt

Every order has a printable receipt page showing the items, the services applied
to each, and the total.

## Screenshots

Every state below is shown at three widths — desktop (1440px), tablet (834px) and mobile (430px). The hero above is the desktop view, which is how this role's screens are normally used.

**Order history**

| Desktop                                                                       | Tablet                                                                      | Mobile                                                                      |
| ----------------------------------------------------------------------------- | --------------------------------------------------------------------------- | --------------------------------------------------------------------------- |
| ![Order history — desktop](../../../assets/customer-orders-index-desktop.png) | ![Order history — tablet](../../../assets/customer-orders-index-tablet.png) | ![Order history — mobile](../../../assets/customer-orders-index-mobile.png) |

**No orders yet**

| Desktop                                                                       | Tablet                                                                      | Mobile                                                                      |
| ----------------------------------------------------------------------------- | --------------------------------------------------------------------------- | --------------------------------------------------------------------------- |
| ![No orders yet — desktop](../../../assets/customer-orders-empty-desktop.png) | ![No orders yet — tablet](../../../assets/customer-orders-empty-tablet.png) | ![No orders yet — mobile](../../../assets/customer-orders-empty-mobile.png) |

**Booking form — pickup date and items**

| Desktop                                                                                               | Tablet                                                                                              | Mobile                                                                                              |
| ----------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| ![Booking form — pickup date and items — desktop](../../../assets/customer-orders-create-desktop.png) | ![Booking form — pickup date and items — tablet](../../../assets/customer-orders-create-tablet.png) | ![Booking form — pickup date and items — mobile](../../../assets/customer-orders-create-mobile.png) |

**`pickup_scheduled` — booked, still cancellable**

| Desktop                                                                                                                   | Tablet                                                                                                                  | Mobile                                                                                                                  |
| ------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| ![`pickup_scheduled` — booked, still cancellable — desktop](../../../assets/customer-orders-pickup-scheduled-desktop.png) | ![`pickup_scheduled` — booked, still cancellable — tablet](../../../assets/customer-orders-pickup-scheduled-tablet.png) | ![`pickup_scheduled` — booked, still cancellable — mobile](../../../assets/customer-orders-pickup-scheduled-mobile.png) |

**`in_pickup` — collected, on the way to the shop**

| Desktop                                                                                                             | Tablet                                                                                                            | Mobile                                                                                                            |
| ------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| ![`in_pickup` — collected, on the way to the shop — desktop](../../../assets/customer-orders-in-pickup-desktop.png) | ![`in_pickup` — collected, on the way to the shop — tablet](../../../assets/customer-orders-in-pickup-tablet.png) | ![`in_pickup` — collected, on the way to the shop — mobile](../../../assets/customer-orders-in-pickup-mobile.png) |

**`awaiting_payment` — priced, waiting to be paid**

| Desktop                                                                                                                    | Tablet                                                                                                                   | Mobile                                                                                                                   |
| -------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------ |
| ![`awaiting_payment` — priced, waiting to be paid — desktop](../../../assets/customer-orders-awaiting-payment-desktop.png) | ![`awaiting_payment` — priced, waiting to be paid — tablet](../../../assets/customer-orders-awaiting-payment-tablet.png) | ![`awaiting_payment` — priced, waiting to be paid — mobile](../../../assets/customer-orders-awaiting-payment-mobile.png) |

**`in_cleaning` — paid, being worked on**

| Desktop                                                                                                     | Tablet                                                                                                    | Mobile                                                                                                    |
| ----------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| ![`in_cleaning` — paid, being worked on — desktop](../../../assets/customer-orders-in-cleaning-desktop.png) | ![`in_cleaning` — paid, being worked on — tablet](../../../assets/customer-orders-in-cleaning-tablet.png) | ![`in_cleaning` — paid, being worked on — mobile](../../../assets/customer-orders-in-cleaning-mobile.png) |

**`cleaning_done` — ready for collection at the shop**

| Desktop                                                                                                                    | Tablet                                                                                                                   | Mobile                                                                                                                   |
| -------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------ |
| ![`cleaning_done` — ready for collection at the shop — desktop](../../../assets/customer-orders-cleaning-done-desktop.png) | ![`cleaning_done` — ready for collection at the shop — tablet](../../../assets/customer-orders-cleaning-done-tablet.png) | ![`cleaning_done` — ready for collection at the shop — mobile](../../../assets/customer-orders-cleaning-done-mobile.png) |

**`in_delivery` — on its way back**

| Desktop                                                                                               | Tablet                                                                                              | Mobile                                                                                              |
| ----------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| ![`in_delivery` — on its way back — desktop](../../../assets/customer-orders-in-delivery-desktop.png) | ![`in_delivery` — on its way back — tablet](../../../assets/customer-orders-in-delivery-tablet.png) | ![`in_delivery` — on its way back — mobile](../../../assets/customer-orders-in-delivery-mobile.png) |

**`completed` — with the full action history**

| Desktop                                                                                                        | Tablet                                                                                                       | Mobile                                                                                                       |
| -------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------ |
| ![`completed` — with the full action history — desktop](../../../assets/customer-orders-completed-desktop.png) | ![`completed` — with the full action history — tablet](../../../assets/customer-orders-completed-tablet.png) | ![`completed` — with the full action history — mobile](../../../assets/customer-orders-completed-mobile.png) |

**`cancelled` — kept in history, not deleted**

| Desktop                                                                                                        | Tablet                                                                                                       | Mobile                                                                                                       |
| -------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------ |
| ![`cancelled` — kept in history, not deleted — desktop](../../../assets/customer-orders-cancelled-desktop.png) | ![`cancelled` — kept in history, not deleted — tablet](../../../assets/customer-orders-cancelled-tablet.png) | ![`cancelled` — kept in history, not deleted — mobile](../../../assets/customer-orders-cancelled-mobile.png) |

**Printable receipt**

| Desktop                                                                             | Tablet                                                                            | Mobile                                                                            |
| ----------------------------------------------------------------------------------- | --------------------------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| ![Printable receipt — desktop](../../../assets/customer-orders-receipt-desktop.png) | ![Printable receipt — tablet](../../../assets/customer-orders-receipt-tablet.png) | ![Printable receipt — mobile](../../../assets/customer-orders-receipt-mobile.png) |

→ One-minute version: [tldr.md](tldr.md)
→ Implementation detail: [technical.md](technical.md)
