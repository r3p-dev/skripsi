# Staff — The Task Board & the Lock

The single most important mechanism in the staff app. Read this before the other
staff documents; they all assume it.

**Code:** [`task_service.ts`](../../app/services/task_service.ts) ·
[`trip_controller.ts`](../../app/controllers/staff/trip_controller.ts) ·
page [`staff/trip/index.tsx`](../../inertia/pages/staff/trip/index.tsx)

---

## 1. The problem it solves

Before the system, work was assigned in a WhatsApp group. Two people drive to
the same address. A pair of shoes sits on the shelf because everyone assumed
someone else had inspected it. Nobody can say who collected order 041.

The task board replaces that with three rules:

1. **Available work is a queue anyone can see**, not an assignment someone makes.
2. **Opening a task claims it.** From that moment it disappears from everyone
   else's queue.
3. **A staff member holds at most one task.** Opening the board while holding one
   sends you straight back to it.

---

## 2. The three queues

`GET /staff/trips` renders one page with three tabs:

| Tab           | Source                              | Orders in status                        | Claimable? |
| ------------- | ----------------------------------- | --------------------------------------- | ---------- |
| **Trips**     | `TaskService.getTripQueue`          | `pickup_scheduled` (due/overdue) + `in_delivery` | yes |
| **Inspeksi**  | `TaskService.getInspectionQueue`    | `in_inspection`                          | yes        |
| **Pencucian** | `TaskService.getCleaningQueue`      | `in_cleaning`                            | **no**     |

### Trips — pickups and deliveries in one list

```ts
const orders = await Order.query()
  .where((pickups) => pickups
    .where('status', OrderStatus.PICKUP_SCHEDULED)
    .where('pickup_date', '<=', today.toISODate()!))
  .orWhere('status', OrderStatus.IN_DELIVERY)
  .preload('address')
  .preload('actions')

const available = orders.filter((order) => this.resolveTaskLock(order, typeOf(order)) === null)

return this.routeService.buildRoutePlanForOrders(this.toRouteOrders(available), { originLat, originLng })
```

Three decisions embedded here:

- **`in_pickup` is deliberately excluded.** An order in that status has already
  been claimed by someone who is on their way. It is *somebody's current task*,
  not available work.
- **Overdue pickups are mixed in with today's** (`pickup_date <= today`), not
  listed separately. A stop missed yesterday is just another stop on today's
  route; a separate "overdue" list would be a list nobody opens.
- **Pickups and deliveries share one list**, sorted nearest-first, because the
  van does both on the same run. Splitting them would force staff to merge two
  routes in their head.

Ordering comes from [`RouteService`](../../app/services/route_service.ts): straight-line
Haversine distance from the shop (`STORE_LATITUDE/LONGITUDE` in the controller),
sorted ascending. Orders with no address sort last (`Infinity`).

> **What this is not:** a routing engine. No roads, no traffic, no
> travelling-salesman optimisation — the distance shown on each card is
> as-the-crow-flies from the shop, and the sort is a reasonable proxy for
> "closest first". `RouteService`'s own doc comment says so explicitly. If real
> routing is ever needed, this is the one class to replace.

### Inspections

```ts
Order.query().whereIn('status', [OrderStatus.IN_INSPECTION]).orderBy('created_at', 'asc').preload('actions')
  → filtered to those with no lock
```

**Oldest first** — the opposite of every other list in the app, which is newest
first. Shoes that arrived first should be inspected first, or they sit on the
shelf indefinitely.

### Cleaning

```ts
Order.query().where('status', OrderStatus.IN_CLEANING).orderBy('created_at', 'asc')
  .preload('items', (q) => q.preload('service').preload('item'))
  .preload('actions')
```

⚠️ **Nothing is filtered out of this queue** — cleaning is *not* a claimable
task.

> **Why:** several people work the same batch of shoes at once, in the same
> room, looking at the same rack. Locking a wash to one person would model the
> work wrongly and just get in the way. The trade-off is that two staff can both
> mark the same order washed; the second one hits `firstOrFail()` on a status
> that has already changed and gets a 404, which is an acceptable way to lose
> that race.

Each card carries the inspection photo as the "before" the washer compares
against — which is why `actions` are preloaded here.

---

## 3. The lock

There is **no lock table and no lock column**. The current holder of a task is
*derived* from the order's action log.

```ts
// TaskService.resolveTaskLock
resolveTaskLock(order: Order, type: TaskType): { staffId: number } | null {
  const relevantNames = [ATTEMPT_ACTION[type], RELEASE_ACTION[type], type]

  const lastAction = order.actions
    .filter((action) => relevantNames.includes(action.name))
    .sort((a, b) => a.createdAt.toMillis() - b.createdAt.toMillis())
    .at(-1)

  if (lastAction?.name === ATTEMPT_ACTION[type]) return { staffId: lastAction.staffId }

  return null
}
```

Read it as a state machine over three action names, per task type:

| Last relevant action | Lock state                        |
| -------------------- | --------------------------------- |
| `attempt_pickup`     | **held** by that action's staff   |
| `release_pickup`     | free                              |
| `pickup` (completed) | free (and the task no longer exists — status moved on) |
| none                 | free                              |

> **Why derive instead of store:** the action log has to exist anyway — it is the
> audit trail the whole product is built on. Deriving the lock from it means
> there is exactly one source of truth, it is impossible for the lock and the
> history to disagree, and "who had this and when did they give it up?" is
> answerable forever. A `locked_by` column would have needed clearing on every
> path and would have told you nothing about yesterday.
>
> **The cost:** resolving a lock requires the order's actions to be preloaded,
> so every queue and task query carries `.preload('actions')`, and the filtering
> happens in JavaScript rather than SQL. At this table size that is free; at ten
> thousand open orders it would not be.

### Claiming happens on GET

```ts
// TaskService.claimTask, called from TripController.show and InspectionController.show
const order = await this.getTaskOrder(orderNumber, type)
const lock  = this.resolveTaskLock(order, type)

if (lock) return { order, lock }        // already held — return it untouched

await db.transaction(async (trx) => {
  await OrderAction.create({ orderId: order.id, staffId: staff.id, name: ATTEMPT_ACTION[type], ... }, { client: trx })

  if (type === ActionName.PICKUP) {
    await order.merge({ status: OrderStatus.IN_PICKUP }).useTransaction(trx).save()
  }
})

return { order, lock: { staffId: staff.id } }
```

Two things that will surprise you:

⚠️ **A `GET` request mutates.** Opening the task page *is* the claim. There is no
separate "claim" button.

> **Why:** in the van, on a phone, the natural gesture is to tap the card you are
> driving to. Requiring a second "claim" tap would mean people open a card to
> read the address, drive off, and never claim it — leaving it in everyone's
> queue. Making the open the claim matches what the staff member actually
> intends. The cost is a non-idempotent GET, which would be unacceptable in a
> public API and is tolerable in a session-authenticated internal screen.

⚠️ **Claiming an already-locked task does not fail.** It returns the existing
lock, and the controller renders the page with `blocked: true` — a read-only view
saying someone else has it. Failing would be a dead end; showing who holds it is
useful.

Only **pickup** flips the order status on claim (`pickup_scheduled → in_pickup`),
because that is the one the customer can see: *"Dalam Penjemputan"* tells them
someone is on the way. Delivery and inspection have no equivalent customer-facing
in-progress status, so their claim is invisible outside the staff app.

### Releasing

```ts
// TaskService.releaseTask
const order = await this.getTaskOrderHeldBy(staff, orderNumber, type)   // must be yours

await db.transaction(async (trx) => {
  await OrderAction.create({ ..., name: RELEASE_ACTION[type] }, { client: trx })

  if (type === ActionName.PICKUP) {
    return order.merge({ status: OrderStatus.PICKUP_SCHEDULED }).useTransaction(trx).save()   // undo the claim
  }

  return order
})
```

The order returns to the queue for anyone. Pickup also reverts its status, which
puts it back in the customer's *"Penjemputan Dijadwalkan"* view — and back in the
daily-capacity count.

### The guard on every mutation

```ts
// TaskService.getTaskOrderHeldBy — used by completeTask, completeInspection, releaseTask
const lock = this.resolveTaskLock(order, type)

if (!lock || lock.staffId !== staff.id) {
  throw E_VALIDATION_ERROR('status', 'Anda tidak sedang memproses tugas ini.')
}
```

Every state-changing task operation goes through it. A staff member cannot
complete or release work someone else claimed, even by crafting the request.

⚠️ `markCleaningDone` deliberately does **not** use this guard — cleaning is
unlocked, as described above.

---

## 4. One task at a time

```ts
// TripController.index
const activeTask = await this.taskService.findActiveTask(staff)

if (activeTask?.type === ActionName.INSPECTION) return redirect('staff.inspection.show', { number })
if (activeTask)                                  return redirect('staff.trip.show', { number, type })

// otherwise render the three queues
```

`findActiveTask` looks for any order in a claimable status carrying an `attempt_*`
action by this staff member, then confirms with `resolveTaskLock` that the lock is
still theirs:

```ts
const orders = await Order.query()
  .whereIn('status', claimable.flatMap((type) => TASK_STATUSES[type]))
  .whereHas('actions', (q) => q.where('staff_id', staff.id).whereIn('name', claimable.map((t) => ATTEMPT_ACTION[t])))
  .preload('actions')

for (const order of orders)
  for (const type of claimable)
    if (this.resolveTaskLock(order, type)?.staffId === staff.id) return { orderNumber: order.orderNumber, type }
```

The `whereHas` narrows the candidate set in SQL; `resolveTaskLock` decides
correctly in JavaScript (an order this staff member claimed *and released* still
matches the `whereHas`, but resolves to no lock).

> **Why force a redirect rather than just showing the board:** the physical
> constraint is real — you cannot be at two addresses at once, and an inspection
> half-typed on a phone is lost if you wander off to another screen. Making the
> board unreachable while holding a task means a task can only end two ways:
> finished, or explicitly released. There is no third state where work is quietly
> abandoned but still locked.

To get back to the board, finish the task or press cancel (which releases it).

---

## 5. The task types, in one table

Defined at the top of [`task_service.ts`](../../app/services/task_service.ts):

```ts
const TASK_STATUSES = {
  pickup:     [OrderStatus.PICKUP_SCHEDULED, OrderStatus.IN_PICKUP],   // two: claim flips it to IN_PICKUP
  delivery:   [OrderStatus.IN_DELIVERY],
  inspection: [OrderStatus.IN_INSPECTION],
}

const ATTEMPT_ACTION = { pickup: 'attempt_pickup', delivery: 'attempt_delivery', inspection: 'attempt_inspection' }
const RELEASE_ACTION = { pickup: 'release_pickup', delivery: 'release_delivery', inspection: 'release_inspection' }
const NEXT_STATUS    = { pickup: OrderStatus.IN_INSPECTION, delivery: OrderStatus.COMPLETED }   // photo tasks only
```

`TASK_STATUSES.pickup` has **two** entries specifically because claiming changes
the status: the task must remain reachable to the person holding it, so
`getTaskOrder` has to accept both.

`PhotoTaskType` (`pickup | delivery`) is the subset completed with a plain proof
photo and a straight status advance. Inspection is completed differently — with
item and service data — so it has its own method and is not in `NEXT_STATUS`.

---

## 6. Adding a fourth task type

If you ever need one, this is the checklist:

1. Add the action names to `ActionName` and `ActionNameLabel`.
2. Add entries to `TASK_STATUSES`, `ATTEMPT_ACTION`, `RELEASE_ACTION`, and
   `NEXT_STATUS` if it is a photo task.
3. Add a queue method to `TaskService` that filters on `resolveTaskLock(...) === null`.
4. Add the type to the `claimable` array in `findActiveTask`, or the
   one-task-at-a-time rule will not cover it.
5. Add a route, controller, and page; remember the router `.where()` constraint
   if it goes in the `:type` slot.
6. Add the new labels to the customer timeline only if the customer should see
   them — see [customer/order.md](../customer/order.md).
