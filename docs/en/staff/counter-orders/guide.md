# Counter Orders — Guide

Someone walks into the shop with a pair of shoes. This is how staff take that
order.

## Why it is different from an online order

An online order is spread over days: the customer books, a courier collects,
someone inspects and prices, the customer pays, and only then does washing
start.

At the counter, all of that collapses into one moment. The customer is standing
there with the goods. Staff can see what needs doing, quote a price, and take
the money immediately.

So a counter order **skips straight to the wash queue**. There is no pickup, no
inspection stage, and no waiting for payment — those steps have already happened
in person.

## Taking the order

The form combines everything:

**Who** — the customer's name and phone. Staff can optionally attach the order
to an existing account by searching for them. Typing three or more characters of
a name or phone number brings up matches; fewer than three returns nothing.

Attaching an account is worth doing when the customer is a regular — it keeps
their order history in one place instead of creating an account-less record.

**What** — the goods, exactly as in an [inspection](../inspection/): type, brand,
model, size, material, condition, one main service each, plus any add-ons.
Between 1 and 10 items.

**Money** — the payment method (cash, QRIS, or debit). If they pay cash, staff
also record how much was handed over, so the receipt can show the change.

**A photo** of the goods as received, and an optional note.

## Delivery at the counter

Staff can offer to deliver the cleaned goods back rather than have the customer
return.

This only works if the customer **has an account and that account has a saved
address**. The address is the only place a delivery destination exists.

If delivery is requested without an account, or with an account that has no
address, the form is rejected with a message explaining which is missing. It is
not silently downgraded to collect-at-shop — staff are told, because it changes
what they promise the customer.

The resulting order is marked as a delivery type, so when washing finishes it
goes to the delivery queue instead of sitting waiting for collection.

## The receipt

After creating the order, staff land on a receipt page. For cash payments it
shows the **change due** — what was handed over minus the total.

## Correcting goods

There is an edit screen for fixing the goods on an order. It re-prices the whole
order from scratch: the old items are removed and the submitted list becomes the
new truth.

**But it only works while an order is awaiting payment.** Since a counter order
is already paid the moment it is created, this screen does not apply to counter
orders. It exists for online orders that have been inspected but where the
customer has not paid yet — if the inspector made a mistake, this is where it
gets fixed before the customer is charged.

Once money has changed hands, the goods are locked.

## What happens next

The order is in the wash queue like any other. From there it follows the normal
path: washed, then either delivered or collected.

## Screenshots

Every state below is shown at three widths — desktop (1440px), tablet (834px) and mobile (430px). The hero above is the mobile view, which is how this role's screens are normally used.

**Counter order form — goods, payment, photo in one**

| Desktop                                                                                                                 | Tablet                                                                                                                | Mobile                                                                                                                |
| ----------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| ![Counter order form — goods, payment, photo in one — desktop](../../../assets/staff-counter-orders-create-desktop.png) | ![Counter order form — goods, payment, photo in one — tablet](../../../assets/staff-counter-orders-create-tablet.png) | ![Counter order form — goods, payment, photo in one — mobile](../../../assets/staff-counter-orders-create-mobile.png) |

**Customer autocomplete (3+ characters)**

| Desktop                                                                                                     | Tablet                                                                                                    | Mobile                                                                                                    |
| ----------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| ![Customer autocomplete (3+ characters) — desktop](../../../assets/staff-counter-orders-search-desktop.png) | ![Customer autocomplete (3+ characters) — tablet](../../../assets/staff-counter-orders-search-tablet.png) | ![Customer autocomplete (3+ characters) — mobile](../../../assets/staff-counter-orders-search-mobile.png) |

**Correcting goods on an order awaiting payment**

| Desktop                                                                                                           | Tablet                                                                                                          | Mobile                                                                                                          |
| ----------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| ![Correcting goods on an order awaiting payment — desktop](../../../assets/staff-counter-orders-edit-desktop.png) | ![Correcting goods on an order awaiting payment — tablet](../../../assets/staff-counter-orders-edit-tablet.png) | ![Correcting goods on an order awaiting payment — mobile](../../../assets/staff-counter-orders-edit-mobile.png) |

**Receipt showing change due on a cash payment**

| Desktop                                                                                                             | Tablet                                                                                                            | Mobile                                                                                                            |
| ------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| ![Receipt showing change due on a cash payment — desktop](../../../assets/staff-counter-orders-receipt-desktop.png) | ![Receipt showing change due on a cash payment — tablet](../../../assets/staff-counter-orders-receipt-tablet.png) | ![Receipt showing change due on a cash payment — mobile](../../../assets/staff-counter-orders-receipt-mobile.png) |

→ One-minute version: [tldr.md](tldr.md)
→ Implementation detail: [technical.md](technical.md)
