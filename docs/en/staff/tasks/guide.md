# Tasks — Guide

Everything a staff member has to do lives on one page: `/staff/tasks`. It is
divided into four tabs.

## Where the work comes from

There is no separate to-do list that someone fills in. **The queue is the order
list, viewed from a different angle.**

An order sitting in "pickup scheduled" _is_ a pickup job. An order in "in
cleaning" _is_ a wash job. When someone finishes a task the order's status
changes, and it disappears from that tab and appears in the next one
automatically.

This means the queue can never drift out of sync with reality. There is nothing
to reconcile.

## The four tabs

**Trips** — pickups and deliveries together, because both are journeys to an
address. The list is ordered as a planned route rather than by time, so a staff
member driving out gets a sensible sequence of stops with distances.

**Inspection** — orders that have been collected and are waiting to be examined
and priced. Ordered oldest first.

**Cleaning** — orders that are paid for and waiting to be washed.

**Collection** — orders that are washed and waiting for the customer to come and
get them.

## Claiming: how two people avoid doing the same job

This is the important mechanic.

When a staff member **opens** a task, it is claimed by them. No button, no
confirmation — opening it is the claim.

From that moment, other staff see the task as taken. If someone else opens it,
they get the order details but the page tells them it is being handled by
somebody else, and the action buttons are gone.

### Claims expire

A claim lasts **three hours**.

This matters because staff drop things. A phone dies, a shift ends, someone
opens a task and gets pulled away. Without expiry, that order would be locked
forever with no way to recover it.

After three hours, the task returns to the pool and anyone can take it. Nobody
has to unlock anything.

### Giving a task back

If a staff member opens something and realises they cannot do it, they can
return it to the queue explicitly rather than waiting out the three hours. It
becomes immediately available again.

Only the person holding a claim can release it.

### Not everything is claimed

Only **pickup, delivery, and inspection** are claimed. These are jobs one person
physically does — one courier drives to one address.

**Cleaning and collection are not claimed.** Several people work the wash area
at once, and handing goods over the counter is whoever is standing there.
Locking those would slow the shop down for no benefit.

## Doing the work

Each task type has its own flow, documented separately:

- [trips](../trips/) — pickup and delivery runs
- [inspection](../inspection/) — recording and pricing goods
- [cleaning-collection](../cleaning-collection/) — washing, notifying, handover

Most of them require a **photo** as proof of completion.

## Things that catch people out

**Opening a task changes data.** Merely viewing the detail page claims it. If a
staff member browses through several tasks to see what is there, they have
claimed all of them — for three hours each, unless they release them.

**A taken task still opens.** They will not get an error page. They see the
order, with a note that someone else has it and no way to act.

## Screenshots

Every state below is shown at three widths — desktop (1440px), tablet (834px) and mobile (430px). The hero above is the mobile view, which is how this role's screens are normally used.

**The queue with all four tabs and their counts**

| Desktop                                                                                                   | Tablet                                                                                                  | Mobile                                                                                                  |
| --------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| ![The queue with all four tabs and their counts — desktop](../../../assets/staff-tasks-index-desktop.png) | ![The queue with all four tabs and their counts — tablet](../../../assets/staff-tasks-index-tablet.png) | ![The queue with all four tabs and their counts — mobile](../../../assets/staff-tasks-index-mobile.png) |

**Trips tab — pickups and deliveries, route-ordered**

| Desktop                                                                                                           | Tablet                                                                                                          | Mobile                                                                                                          |
| ----------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| ![Trips tab — pickups and deliveries, route-ordered — desktop](../../../assets/staff-tasks-tab-trips-desktop.png) | ![Trips tab — pickups and deliveries, route-ordered — tablet](../../../assets/staff-tasks-tab-trips-tablet.png) | ![Trips tab — pickups and deliveries, route-ordered — mobile](../../../assets/staff-tasks-tab-trips-mobile.png) |

**Inspection tab**

| Desktop                                                                             | Tablet                                                                            | Mobile                                                                            |
| ----------------------------------------------------------------------------------- | --------------------------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| ![Inspection tab — desktop](../../../assets/staff-tasks-tab-inspection-desktop.png) | ![Inspection tab — tablet](../../../assets/staff-tasks-tab-inspection-tablet.png) | ![Inspection tab — mobile](../../../assets/staff-tasks-tab-inspection-mobile.png) |

**Cleaning tab**

| Desktop                                                                         | Tablet                                                                        | Mobile                                                                        |
| ------------------------------------------------------------------------------- | ----------------------------------------------------------------------------- | ----------------------------------------------------------------------------- |
| ![Cleaning tab — desktop](../../../assets/staff-tasks-tab-cleaning-desktop.png) | ![Cleaning tab — tablet](../../../assets/staff-tasks-tab-cleaning-tablet.png) | ![Cleaning tab — mobile](../../../assets/staff-tasks-tab-cleaning-mobile.png) |

**Collection tab, with the ready-notice action**

| Desktop                                                                                                           | Tablet                                                                                                          | Mobile                                                                                                          |
| ----------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| ![Collection tab, with the ready-notice action — desktop](../../../assets/staff-tasks-tab-collection-desktop.png) | ![Collection tab, with the ready-notice action — tablet](../../../assets/staff-tasks-tab-collection-tablet.png) | ![Collection tab, with the ready-notice action — mobile](../../../assets/staff-tasks-tab-collection-mobile.png) |

→ One-minute version: [tldr.md](tldr.md)
→ Implementation detail: [technical.md](technical.md)
