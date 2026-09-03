# Inspection — Guide

Inspection is the moment an order stops being a guess and becomes a bill.

## Why inspection exists

When a customer books, they describe what they are sending: "a pair of white
leather sneakers". That is useful for planning, but it is not enough to price
anything. The shoes might be lightly dusty or badly stained. There might be four
pairs instead of one. The sole might need repair.

So the app deliberately does not price at booking. It waits until a person has
the goods in front of them.

## What staff do

An inspection screen shows the order and the full service catalogue.

For each physical item, the staff member records:

- **What it is** — type (shoe, bag, helmet), brand, model, size, material
- **What condition it arrived in** — free text, up to 255 characters
- **Which service it needs** — one main service
- **Any add-ons** — optional extras like a protective coating or a rush fee
- **A note**, if anything needs saying

They can record between 1 and 10 items.

### The catalogue only offers what fits

The service list is filtered by item type. Shoes can take shoe-wash and
shoe-repair services. Bags only take bag-wash. Helmets only helmet-wash.

Add-ons are different: they are not tied to any item type, so a protective
coating applies just as well to a bag as to a shoe. They are offered for
everything.

If someone submits a mismatched combination — a bag-wash service on a helmet —
the app rejects it and points at the exact item in the list that is wrong.

## The price

The total is simply the sum of every service chosen across every item. The main
service plus each add-on contributes its catalogue price.

The price is recorded on each line at the moment of inspection. If the catalogue
changes next month, this order keeps what it was charged.

## The customer's list is replaced

This surprises people, so it is worth stating plainly.

When staff submit an inspection, **the items the customer described are
deleted** and replaced with the items staff recorded.

That is deliberate. The customer's description was an estimate made at booking.
The staff member is holding the actual goods. If the customer said one pair and
sent three, the inspection is what is true, and the bill follows the inspection.

## Finishing

A photo is required — proof of the goods' condition on arrival. JPG or PNG, up
to 5 MB.

On submission, everything happens together: the old items go, the new items and
their service lines are written, the total is set, the order moves to **awaiting
payment**, the action is logged with the photo, and the claim is released.

If any part fails, none of it is applied. There is no half-inspected state.

The customer can now see their bill and pay.

## Correcting a mistake

If the price turns out wrong, staff can edit the goods on an order that is still
awaiting payment — see [counter-orders](../counter-orders/) for that flow. Once
the customer has paid, the items are locked.

Re-pricing always recalculates the whole total from the submitted list. There is
no adding a line to an existing bill.

## Screenshots

Every state below is shown at three widths — desktop (1440px), tablet (834px) and mobile (430px). The hero above is the mobile view, which is how this role's screens are normally used.

**Inspection form — goods, condition, services**

| Desktop                                                                                                      | Tablet                                                                                                     | Mobile                                                                                                     |
| ------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| ![Inspection form — goods, condition, services — desktop](../../../assets/staff-inspection-show-desktop.png) | ![Inspection form — goods, condition, services — tablet](../../../assets/staff-inspection-show-tablet.png) | ![Inspection form — goods, condition, services — mobile](../../../assets/staff-inspection-show-mobile.png) |

**Blocked inspection (`blocked: true`, empty catalogue)**

| Desktop                                                                                                                  | Tablet                                                                                                                 | Mobile                                                                                                                 |
| ------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| ![Blocked inspection (`blocked: true`, empty catalogue) — desktop](../../../assets/staff-inspection-blocked-desktop.png) | ![Blocked inspection (`blocked: true`, empty catalogue) — tablet](../../../assets/staff-inspection-blocked-tablet.png) | ![Blocked inspection (`blocked: true`, empty catalogue) — mobile](../../../assets/staff-inspection-blocked-mobile.png) |

→ One-minute version: [tldr.md](tldr.md)
→ Implementation detail: [technical.md](technical.md)
