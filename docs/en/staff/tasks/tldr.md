# Tasks — TL;DR

**One page holds all staff work**, split into four tabs. Opening a task
**claims** it so two people cannot do the same job.

![The queue with all four tabs and their counts](../../../assets/staff-tasks-index-mobile.png)

## The five things to know

1. **The queue is derived from order status, not a task table.** There are no
   task rows — `TASK_SOURCE_STATUS` maps each task type to the status that
   produces it.
2. **Claims are automatic.** Opening a task claims it. There is no "accept"
   button.
3. **A claim expires after 3 hours** (`CLAIM_DURATION_HOURS`). After that anyone
   can take over.
4. **Only three task types are claimable**: pickup, delivery, inspection.
   Cleaning and collection are shared work.
5. **The claim is won with a conditional `UPDATE`**, not a read-then-write — so
   two staff tapping simultaneously cannot both win.

## The four tabs

| Tab                       | Source status                     | Claimable |
| ------------------------- | --------------------------------- | --------- |
| Trips (pickup + delivery) | `pickup_scheduled`, `in_delivery` | yes       |
| Inspection                | `in_pickup`                       | yes       |
| Cleaning                  | `in_cleaning`                     | no        |
| Collection                | `cleaning_done`                   | no        |

## Routes at a glance

| Method | URL                               | Purpose                           |
| ------ | --------------------------------- | --------------------------------- |
| GET    | `/staff/tasks`                    | The queue — all four tabs at once |
| GET    | `/staff/tasks/:number/trip/:type` | Open a trip (claims it)           |
| DELETE | `/staff/tasks/:number/trip/:type` | Return it to the queue            |

## The gotcha

**A blocked task still renders a page** — it just comes back with
`blocked: true` and no route data. Staff see the order but cannot act on it.
Do not expect a 403.

Second gotcha: **claiming is a side effect of a `GET`.** Opening the task detail
page mutates the database. That is intentional but surprising.

→ Plain-language walkthrough: [guide.md](guide.md)
→ Implementation detail: [technical.md](technical.md)
