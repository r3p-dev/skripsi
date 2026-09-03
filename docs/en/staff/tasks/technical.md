# Tasks — Technical

## Routes

| Method | URL                               | Controller                 | Route name                 |
| ------ | --------------------------------- | -------------------------- | -------------------------- |
| GET    | `/staff/tasks`                    | `staff.Trip.index`         | `staff.trip.index`         |
| GET    | `/staff/tasks/:number/trip/:type` | `staff.Trip.show`          | `staff.trip.show`          |
| POST   | `/staff/tasks/:number/trip/:type` | `staff.Trip.update`        | `staff.trip.update`        |
| DELETE | `/staff/tasks/:number/trip/:type` | `staff.Trip.destroy`       | `staff.trip.destroy`       |
| GET    | `/staff/tasks/:number/inspection` | `staff.Inspection.show`    | `staff.inspection.show`    |
| POST   | `/staff/tasks/:number/inspection` | `staff.Inspection.update`  | `staff.inspection.update`  |
| DELETE | `/staff/tasks/:number/inspection` | `staff.Inspection.destroy` | `staff.inspection.destroy` |
| POST   | `/staff/tasks/:number/cleaning`   | `staff.Cleaning.update`    | `staff.cleaning.update`    |
| POST   | `/staff/tasks/:number/collection` | `staff.Collection.update`  | `staff.collection.update`  |
| GET    | `/staff/tasks/:number/tag`        | `staff.Tag.show`           | `staff.tag.show`           |

## Files

| Concern     | Path                                                                                 |
| ----------- | ------------------------------------------------------------------------------------ |
| Service     | [app/services/task_service.ts](../../../../app/services/task_service.ts)             |
| Controllers | [app/controllers/staff/](../../../../app/controllers/staff/)                         |
| Task enum   | [app/enums/task_enum.ts](../../../../app/enums/task_enum.ts)                         |
| Routing     | [app/services/routing_service.ts](../../../../app/services/routing_service.ts)       |
| Page        | [inertia/pages/staff/trip/index.tsx](../../../../inertia/pages/staff/trip/index.tsx) |

## The queue is derived, not stored

There is **no tasks table**. Task types map onto order statuses:

```ts
export const TASK_SOURCE_STATUS: Record<TaskType, OrderStatus> = {
  [TaskType.PICKUP]: OrderStatus.PICKUP_SCHEDULED,
  [TaskType.INSPECTION]: OrderStatus.IN_PICKUP,
  [TaskType.CLEANING]: OrderStatus.IN_CLEANING,
  [TaskType.DELIVERY]: OrderStatus.IN_DELIVERY,
  [TaskType.COLLECTION]: OrderStatus.CLEANING_DONE,
}
```

A status change _is_ moving the task between queues. Nothing can desynchronise.

`TripController.index` loads all four in parallel:

```ts
const [trips, inspections, cleanings, collections] = await Promise.all([
  this.taskService.getTripQueue(user),
  this.taskService.getInspectionQueue(user),
  this.taskService.getCleaningQueue(),
  this.taskService.getCollectionQueue(),
])
```

Note the first two take `user` (claim-filtered), the last two do not.

## Claim visibility

```ts
#claimableQuery(user) {
  return Order.query().where((query) => {
    query
      .whereNull('claimed_by')
      .orWhere('claimed_by', user.id)
      .orWhere('claimed_at', '<', this.#claimFloor().toJSDate())
  })
}

#claimFloor() { return DateTime.now().minus({ hours: CLAIM_DURATION_HOURS }) }  // 3
```

So a staff member sees unclaimed tasks, their own, and anything whose claim has
gone stale.

## Winning a claim

```ts
async claim(user, order, task) {
  if (!CLAIMABLE_TASKS.includes(task)) return true
  if (order.status !== TASK_SOURCE_STATUS[task]) return false

  const claimed = await db.from('orders')
    .where('id', order.id)
    .where('status', TASK_SOURCE_STATUS[task])
    .where((query) => {
      query.whereNull('claimed_by')
        .orWhere('claimed_by', user.id)
        .orWhere('claimed_at', '<', this.#claimFloor().toJSDate())
    })
    .update({ claimed_by: user.id, claimed_task: task, claimed_at: now }, ['id'])

  if (claimed.length === 0) return false
  await order.refresh()
  return true
}
```

**This is the concurrency guarantee.** The conditions live in the `WHERE` of the
`UPDATE`, so the database decides the winner atomically. `RETURNING id` gives an
empty array to the loser. There is no read-then-write window.

`CLAIMABLE_TASKS = [PICKUP, DELIVERY, INSPECTION]` — cleaning and collection
return `true` immediately without touching the row.

## Blocking and releasing

```ts
isBlocked(user, order) {
  if (order.claimedBy === null || order.claimedBy === user.id) return false
  return !!order.claimedAt && order.claimedAt > this.#claimFloor()
}

async release(user, order) {
  if (order.claimedBy !== user.id) return   // silent no-op
  await this.#clearClaim(order)
}
```

`#assertHolder` throws `E_VALIDATION_ERROR` on `form` when a non-holder tries to
complete a task. Completion handlers call `#clearClaim` inside the same
transaction as the status change.

## Claim-on-GET

Both `Trip.show` and `Inspection.show` claim before rendering:

```ts
const summary = await this.taskService.findSummaryByNumber(params.number)
const claimed = await this.taskService.claim(user, summary, type)

if (!claimed) {
  return inertia.render('...', { order: ..., blocked: true, route: null })
}
const order = await this.taskService.findByNumber(params.number)
```

Two deliberate choices:

- **A `GET` mutates.** Opening the page is the claim.
- **A blocked task renders normally** with `blocked: true`, not a 403. The staff
  member sees context without actions.

`findSummaryByNumber` is a bare lookup; the fully-preloaded `findByNumber`
(address, items→orderItems, actions→staff) runs only after the claim succeeds —
avoiding the expensive query for a loser.

## Trip ordering

`getTripQueue` pulls claimable orders in `pickup_scheduled` or `in_delivery` with
an address, preloads `address`, then hands the stops to `RoutingService.plan`
starting from the depot (`getOperationalAreaCentroid()`, falling back to the
first stop). Results carry `distanceMetres`.

## Data model

Claim columns live on `orders`
([migration](../../../../database/migrations/1781150470631_create_orders_table.ts)):

| Column         | Notes                                     |
| -------------- | ----------------------------------------- |
| `claimed_by`   | FK → users, `ON DELETE SET NULL`, indexed |
| `claimed_task` | string, the `TaskType`                    |
| `claimed_at`   | timestamp                                 |

Composite index `['claimed_by', 'claimed_at']`.

## Edge cases

- **Claims are never swept.** Expiry is evaluated at read time against
  `#claimFloor()`; stale rows keep their values until reclaimed.
- **`claimed_task` is informational.** Eligibility is decided by `status`, not by
  this column.
- **`release` on a task you do not hold is silent**, not an error.
- **Deleting a staff user nulls `claimed_by`** (`ON DELETE SET NULL`), which
  frees the task.
- **Browsing claims things.** Opening several task pages claims each for three
  hours unless released.

→ One-minute version: [tldr.md](tldr.md)
→ Plain-language walkthrough: [guide.md](guide.md)
