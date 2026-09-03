# Trips — TL;DR

Pickup and delivery runs. Both are journeys to a customer address, so they share
one screen, one route planner, and one completion flow.

![Pickup trip with its route map](../../../assets/staff-trips-pickup-mobile.png)

## The five things to know

1. **Pickup and delivery are the same code path**, parameterised by
   `:type` (`pickup` \| `delivery`).
2. **A photo is mandatory to complete a trip.** JPG/PNG, max 5 MB.
3. **Completing a pickup** moves the order to `in_pickup` — it lands in the
   inspection queue. **Completing a delivery** moves it to `completed`.
4. **The queue is route-ordered, not time-ordered.** Stops are sequenced by a
   nearest-neighbour plan from the depot.
5. **OSRM is optional.** If disabled or unreachable, distances fall back to
   haversine × 1.3 and the plan still works.

## Routes at a glance

| Method | URL                               | Purpose                       |
| ------ | --------------------------------- | ----------------------------- |
| GET    | `/staff/tasks/:number/trip/:type` | Open the trip — **claims it** |
| POST   | `/staff/tasks/:number/trip/:type` | Complete it (photo required)  |
| DELETE | `/staff/tasks/:number/trip/:type` | Return it to the queue        |

## Status mapping

```ts
COMPLETION_STATUS = { pickup: in_pickup, delivery: completed }
COMPLETION_ACTION = { pickup: ActionName.PICKUP, delivery: ActionName.DELIVERY }
```

## The gotcha

**An unrecognised `:type` is a validation error, not a 404.** `#taskType` runs
`isTripType` and throws `E_VALIDATION_ERROR` on the `type` field, so only
`pickup` and `delivery` reach the handler.

Second gotcha: **the photo is uploaded before the transaction opens.** A failed
transition leaves an orphaned file on disk.

→ Plain-language walkthrough: [guide.md](guide.md)
→ Implementation detail: [technical.md](technical.md)
