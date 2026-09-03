# Trips — Guide

A trip is a journey to a customer's address — either to collect goods at the
start of an order, or to return them at the end.

## Why pickup and delivery are one thing

From the app's point of view they are the same task: drive to an address, meet
the customer, photograph the handover, move the order forward. Only the
direction and the resulting status differ.

So they share a screen, a route planner, and a completion form. The URL carries
which one it is.

## The route

The trips tab does not simply list jobs by time. It **plans a route**.

Starting from the shop, the app orders the stops so that each is the nearest
remaining one — a simple, predictable sequence rather than an optimal tour. Each
stop shows how far it is.

The starting point is the centre of the operational areas. If no area is
configured, it falls back to the first stop.

### When the routing service is unavailable

Real road distances come from a routing service. It may be switched off or
unreachable.

When that happens, nothing breaks. The app falls back to straight-line distance
multiplied by a road-winding factor of 1.3, which is a decent approximation for
city driving. The stops are still sequenced sensibly, the numbers are just less
precise.

Staff will not see an error, and the tab keeps working.

## Doing a trip

Opening a trip **claims it** — see [tasks](../tasks/) for how that works. Once
claimed, the staff member sees the order, the address, and a map line to it.

They drive, they meet the customer, and they complete the trip by **taking a
photo**. The photo is required. It is proof of handover for both directions —
that the goods were collected, or that they were delivered.

Accepted formats are JPG and PNG, up to 5 MB.

## What happens on completion

**Finishing a pickup** moves the order to "in pickup" and it appears in the
inspection queue. The message tells the staff member to continue to inspection.

**Finishing a delivery** moves the order to "completed". That is the end of the
order's life.

In both cases the app records an action entry against the order — who did it,
when, and the photo — and the claim is released so the staff member's slate is
clear.

## Giving a trip back

If a trip cannot be done, the staff member returns it to the queue. It becomes
available to everyone immediately, without waiting for the three-hour claim
expiry.

## Things to know

**Only orders with an address appear here.** A counter order with no delivery
address is never a trip; it ends at "ready for collection" instead.

**The photo uploads before the order is updated.** If the status change then
fails — for example the order moved on in another tab — the photo has already
been stored. It is harmless, just an unused file.

## Screenshots

Every state below is shown at three widths — desktop (1440px), tablet (834px) and mobile (430px). The hero above is the mobile view, which is how this role's screens are normally used.

**Pickup trip with its route map**

| Desktop                                                                                     | Tablet                                                                                    | Mobile                                                                                    |
| ------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| ![Pickup trip with its route map — desktop](../../../assets/staff-trips-pickup-desktop.png) | ![Pickup trip with its route map — tablet](../../../assets/staff-trips-pickup-tablet.png) | ![Pickup trip with its route map — mobile](../../../assets/staff-trips-pickup-mobile.png) |

**Delivery trip**

| Desktop                                                                      | Tablet                                                                     | Mobile                                                                     |
| ---------------------------------------------------------------------------- | -------------------------------------------------------------------------- | -------------------------------------------------------------------------- |
| ![Delivery trip — desktop](../../../assets/staff-trips-delivery-desktop.png) | ![Delivery trip — tablet](../../../assets/staff-trips-delivery-tablet.png) | ![Delivery trip — mobile](../../../assets/staff-trips-delivery-mobile.png) |

**Blocked — claimed by another staff member**

| Desktop                                                                                                 | Tablet                                                                                                | Mobile                                                                                                |
| ------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| ![Blocked — claimed by another staff member — desktop](../../../assets/staff-trips-blocked-desktop.png) | ![Blocked — claimed by another staff member — tablet](../../../assets/staff-trips-blocked-tablet.png) | ![Blocked — claimed by another staff member — mobile](../../../assets/staff-trips-blocked-mobile.png) |

→ One-minute version: [tldr.md](tldr.md)
→ Implementation detail: [technical.md](technical.md)
