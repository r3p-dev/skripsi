# Staff — Pickup & Delivery

The two field tasks. They are the *same code path* with a different label,
different next status, and a different photo folder.

**Code:** [`trip_controller.ts`](../../app/controllers/staff/trip_controller.ts) ·
[`TaskService.claimTask` / `completeTask` / `releaseTask`](../../app/services/task_service.ts) ·
pages [`staff/trip/index.tsx`](../../inertia/pages/staff/trip/index.tsx),
[`staff/trip/show.tsx`](../../inertia/pages/staff/trip/show.tsx)

Prerequisite: [task-board.md](task-board.md).

---

## 1. Why they share one implementation

A pickup and a delivery are, mechanically, identical: drive to an address on a
route, meet a person, move a bag of shoes, photograph the proof, move the order
to its next status. The differences fit in three lookup tables:

| Aspect                | `pickup`                             | `delivery`               |
| --------------------- | ------------------------------------ | ------------------------ |
| Eligible status       | `pickup_scheduled`, `in_pickup`      | `in_delivery`            |
| Claim changes status  | → `in_pickup` (customer-visible)     | no                       |
| Completing moves to   | `in_inspection`                      | `completed`              |
| Photo folder          | `storage/pickup/`                    | `storage/delivery/`      |
| Action names          | `attempt_pickup` / `release_pickup` / `pickup` | `attempt_delivery` / … |

Hence one route with a `:type` segment, constrained by the router:

```ts
router.get('trips/:number/:type', [controllers.staff.Trip, 'show']).where('type', /^(pickup|delivery)$/)
```

A bogus type is a 404 at routing time — the controller casts `params.type` to
`PhotoTaskType` without re-validating, and that regex is what makes the cast
safe.

---

## 2. The route list

Both types appear in the same **Trips** tab, ordered nearest-first from the shop.
See [task-board.md §2](task-board.md#2-the-three-queues) for the query and why
`in_pickup` orders are excluded.

Each card
([`TripCard`](../../inertia/pages/staff/trip/index.tsx)) shows the order number,
a badge (Jemput / Antar), the recipient's name, phone and street from the
address, the scheduled date, and the straight-line distance in km.

The transformer decides the badge from the status, not from a stored type:

```ts
// RouteItemTransformer
type: this.resource.status === OrderStatus.IN_DELIVERY ? 'delivery' : 'pickup'
```

That value is also what gets put in the link's `:type` param, so the card and the
route can never disagree about which task the tap opens.

---

## 3. Opening a stop = claiming it

```
GET /staff/trips/:number/:type
  └─ TaskService.claimTask(staff, number, type)
       ├─ getTaskOrder: order must be in a status this task accepts, else 404
       ├─ already locked? → return the existing lock untouched
       └─ otherwise: write attempt_* action; if pickup, status → in_pickup
  └─ render staff/trip/show { type, order, blocked: lock.staffId !== staff.id }
```

`blocked: true` renders a read-only view — the task is someone else's. `false`
renders the working view with the photo upload and the cancel button.

For a pickup, the claim is immediately visible to the customer: their tracking
page now reads *"Dalam Penjemputan"*. That single status change is the whole
reason claiming a pickup mutates the order and claiming a delivery does not.

---

## 4. Completing

```
PUT /staff/trips/:number/:type      (multipart: photo)
  └─ completeTaskValidator          photo: ≤5MB, png|jpg|jpeg
  └─ TaskService.completeTask(staff, number, type, payload)
  └─ redirect → staff.trip.index
```

```ts
async completeTask(staff, orderNumber, type: PhotoTaskType, data) {
  const order     = await this.getTaskOrderHeldBy(staff, orderNumber, type)   // must be YOUR task
  const photoPath = await this.storePhoto(type, data.photo)

  return db.transaction(async (trx) => {
    await OrderAction.create({ orderId: order.id, staffId: staff.id, name: type, photoPath, note: null }, { client: trx })

    return order.merge({ status: NEXT_STATUS[type] }).useTransaction(trx).save()
  })
}
```

Read the ordering carefully — it is deliberate:

1. **Ownership is checked first.** `getTaskOrderHeldBy` throws
   *"Anda tidak sedang memproses tugas ini."* if the lock is missing or belongs to
   someone else. No upload happens for a request that was going to fail.
2. **The photo is stored before the transaction opens.** Uploading to disk is
   slow and cannot be rolled back; holding a database transaction open across it
   would keep row locks for the duration of an upload on mobile data.
3. **The action row and the status change are one transaction.** They must both
   land or neither: an order advanced with no proof row would break the audit
   trail and the customer's timeline; a proof row on an unadvanced order would
   put the task back in the queue with a photo already taken.

⚠️ The consequence of (2) is that a failed transaction leaves an **orphan file**
on disk. Harmless — nothing references it — but it means `storage/` is not a
perfect mirror of `order_actions`.

### Photo storage

```ts
const key = `${folder}/${randomUUID()}.${photo.extname}`
await drive.use().putStream(key, createReadStream(photo.tmpPath!))
return drive.use().getSignedUrl(key, { expiresIn: PHOTO_RETENTION })   // '90d'
```

Grouped by proof kind (`pickup/`, `delivery/`, `inspection/`, `cleaning/`) so a
whole category can be audited or archived without picking through unrelated
images. The disk is **private** ([`config/drive.ts`](../../config/drive.ts)), so a
signed URL is the only way in.

⚠️ `photo_path` stores the **signed URL**, not the key. It expires in 90 days,
matching the retention policy, and cannot be regenerated from the row. See
[architecture.md §7](../architecture.md#7-file-storage).

The photo is required — `completeTaskValidator` has no optional path.

> **Why proof photos at all:** the shop takes custody of other people's
> property. A photo at collection is the record of what condition the shoes were
> in on the doorstep, and a photo at handover is the record that they were
> returned. Both surface on the customer's own order page, so the evidence is
> not something the customer has to ask for.

---

## 5. Releasing

```
DELETE /staff/trips/:number/:type
  └─ TaskService.releaseTask   (ownership-checked)
  └─ flash "Tugas dibatalkan." → staff.trip.index
```

Writes a `release_*` action and, for pickups, reverts the status to
`pickup_scheduled`. The stop is back in the queue for anyone, and the customer
sees *"Penjemputan Dijadwalkan"* again.

The release is permanent in the log — the audit trail shows the claim, the
release, and who did both. That is the point: an abandoned task is a fact worth
recording, not something to erase.

---

## 6. What happens next

| Completed task | Order lands in                | Next screen                                     |
| -------------- | ----------------------------- | ----------------------------------------------- |
| pickup         | `in_inspection`               | the **Inspeksi** tab — see [inspection.md](inspection.md) |
| delivery       | `completed`                   | nothing; the order is done                      |

Both redirect the staff member back to the board, where — no longer holding a
task — they see the full queues again.

---

## 7. Failure modes worth knowing

| Situation                                                | Behaviour                                                                 |
| -------------------------------------------------------- | ------------------------------------------------------------------------- |
| Two staff open the same card simultaneously               | Both write an `attempt_*` row; the **later timestamp wins** the lock. The first sees `blocked` on their next load. No error. |
| Customer cancels while a staff member holds the pickup    | Impossible — cancellation requires `pickup_scheduled`, and claiming moved it to `in_pickup`. |
| Staff loses signal mid-upload                             | Nothing is written; the task stays claimed and can be retried             |
| Staff never returns to a claimed task                     | It stays locked indefinitely. **There is no timeout.** Another staff member cannot claim it; the holder must release it, or an admin must be involved out-of-band. |
| Photo over 5 MB / wrong type                              | Validation error on the form                                              |

That fourth row is the sharpest edge in the staff app: **claims never expire**.
If abandoned tasks become a real problem, a time-based auto-release in
`resolveTaskLock` (treat an `attempt_*` older than N hours as free) is the
smallest possible change, and it needs no schema migration — another dividend of
deriving the lock from the log.
