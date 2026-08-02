# Staff — Cleaning

The wash itself, and the one action that closes it. Short feature, but it holds
the branch that decides whether an order is delivered or already finished.

**Code:** [`cleaning_controller.ts`](../../app/controllers/staff/cleaning_controller.ts) ·
[`TaskService.getCleaningQueue` / `markCleaningDone`](../../app/services/task_service.ts) ·
[`tag_controller.ts`](../../app/controllers/staff/tag_controller.ts) ·
pages [`staff/trip/index.tsx`](../../inertia/pages/staff/trip/index.tsx) (Pencucian tab),
[`staff/order/tag.tsx`](../../inertia/pages/staff/order/tag.tsx)

---

## 1. How an order gets here

Two ways into `in_cleaning`, and they are the only two:

| Route in                                     | Set by                                            |
| -------------------------------------------- | ------------------------------------------------- |
| Customer paid (webhook or admin override)    | `TransactionService.handleNotification` / `ReconciliationService.confirmPayment` |
| Walk-in order created at the counter          | `OrderService.createOfflineOrder`                 |

Both mean the same thing: **the money question is settled, start washing.** An
online order is never washed before payment clears, and a walk-in is never
created before payment is taken.

---

## 2. The queue is not claimable

```ts
async getCleaningQueue(): Promise<Order[]> {
  return Order.query()
    .where('status', OrderStatus.IN_CLEANING)
    .orderBy('created_at', 'asc')
    .preload('items', (q) => q.preload('service').preload('item'))
    .preload('actions')
}
```

No lock filter, unlike the trip and inspection queues.

> **Why:** several people work the same batch of shoes at once, in the same
> room, at the same rack. A lock would model the work wrongly and get in the way
> — you would have to claim and release a wash you are doing collaboratively.
> The trade-off is a small race (see §5).

Oldest first, same as inspection — shoes that arrived first leave first.

`items` are preloaded so each card can list what is in the batch. `actions` are
preloaded so each card can show the **inspection photo** as the "before" the
washer compares their work against:

```tsx
const inspectionPhoto = order.actions?.find((action) => action.name === 'Inspeksi Selesai')?.photoPath
```

Walk-in orders were never inspected, so they have no before photo — the card
simply omits it.

---

## 3. The printable tag

`GET /staff/orders/:number/tag` →
[`staff/order/tag.tsx`](../../inertia/pages/staff/order/tag.tsx)

A page styled for the printer, listing the order number, customer, and every item
in the batch. It is attached to the physical batch on the rack.

> **Why a printed tag in a digital system:** the rack is not a screen. Once five
> orders' worth of shoes are drying, the only thing that tells you whose is whose
> is a piece of paper physically attached to them. The tag exists because the
> failure it prevents — mixing up two customers' shoes — is expensive and
> embarrassing in a way no software error is.

The controller uses `OrderService.getOrderByNumber(number)` **without a user
scope**, so any staff member can print any order's tag.

---

## 4. Marking it done

```
PUT /staff/cleanings/:number      (multipart: photo)
  └─ cleaningValidator            photo: image()  — required
  └─ TaskService.markCleaningDone(staff, number, payload)
  └─ flash "Pencucian ORD… selesai." → staff.trip.index
```

```ts
async markCleaningDone(staff, orderNumber, data) {
  const order = await Order.query()
    .where('order_number', orderNumber)
    .where('status', OrderStatus.IN_CLEANING)      // ← the only guard
    .firstOrFail()

  const photoPath = await this.storePhoto('cleaning', data.photo)

  return db.transaction(async (trx) => {
    await OrderAction.create({ orderId: order.id, staffId: staff.id, name: ActionName.CLEANING_DONE, photoPath, note: null }, { client: trx })

    const nextStatus = order.addressId ? OrderStatus.IN_DELIVERY : OrderStatus.COMPLETED

    return order.merge({ status: nextStatus }).useTransaction(trx).save()
  })
}
```

### 4.1 The photo is required

Same rule as every other stage. This is the **"after"** half of the before/after
pair the customer sees on their order page — the visible proof of the work they
paid for. `cleaningValidator` has no optional path.

Photos go to `storage/cleaning/`. Note the folder argument is the literal string
`'cleaning'` rather than a `TaskType`, because cleaning is not a task type — the
`storePhoto` signature is `TaskType | 'cleaning'` for exactly this reason.

### 4.2 The branch

```ts
const nextStatus = order.addressId ? OrderStatus.IN_DELIVERY : OrderStatus.COMPLETED
```

`address_id` is read as *"is there somewhere to deliver this to?"*:

| Order kind             | `address_id` | Next status  | Why                                          |
| ---------------------- | ------------ | ------------ | -------------------------------------------- |
| Online (booked pickup) | set          | `in_delivery`| It came from a door; it goes back to that door |
| Walk-in (counter)      | `null`       | `completed`  | The customer collects it in person            |

> **Why key on the address rather than on `orders.type`:** `type` describes how
> the order *arrived*; `address_id` describes whether there is anywhere to take
> it. They agree today, but the address is the fact the delivery actually depends
> on. If a walk-in customer ever asks for delivery, giving that order an address
> would be enough to make it work.

An order that becomes `in_delivery` joins the **Trips** tab as a delivery stop —
see [pickup-and-delivery.md](pickup-and-delivery.md). An order that becomes
`completed` is finished; the walk-in customer's shoes wait at the counter.

### 4.3 No ownership check

`markCleaningDone` calls `Order.query()` directly rather than
`getTaskOrderHeldBy`. There is no lock to check, by design (§2).

---

## 5. Race behaviour

Two staff marking the same order washed at the same time:

1. Both pass the `where('status', IN_CLEANING)` read.
2. Both store a photo.
3. The first transaction advances the status.
4. The second commits too — writing a **second `cleaning_done` action** and
   setting the same next status again.

The result is two `cleaning_done` rows and one wasted photo. Not corrupting, but
it does mean the audit trail can show a duplicate. The narrow window and the
harmless outcome are why this was left alone; if it ever matters, re-reading the
order inside the transaction (or a conditional `UPDATE … WHERE status = 'in_cleaning'`)
is the fix.

Compare this with the trip/inspection races described in
[pickup-and-delivery.md §7](pickup-and-delivery.md#7-failure-modes-worth-knowing),
where the second staff member instead gets a 404 because the status has already
moved past what the task accepts.

---

## 6. What the customer sees

- Status changes to *"Dalam Pengantaran"* or *"Selesai"*.
- The **before & after slider** appears on their order page, pairing the
  inspection photo with the cleaning photo — the only place in the product where
  two photos are shown together:

```tsx
const beforeAfter = inspectionPhoto && cleaningPhoto ? { before: inspectionPhoto, after: cleaningPhoto } : null
```

Both must exist, so a walk-in (no inspection photo) never shows the slider, and
neither does an order still being washed.

---

## 7. Where to change things

| To change…                                | Edit                                                             |
| ----------------------------------------- | ---------------------------------------------------------------- |
| Make cleaning a claimable task             | Add entries to `TASK_STATUSES`/`ATTEMPT_ACTION`/`RELEASE_ACTION`, filter the queue by `resolveTaskLock`, add it to `findActiveTask` |
| Allow walk-in delivery                     | Give the order an `address_id`; the branch already handles it     |
| Make the cleaning photo optional           | `cleaningValidator` — but it breaks the before/after slider       |
| Tag layout                                 | [`staff/order/tag.tsx`](../../inertia/pages/staff/order/tag.tsx)  |
