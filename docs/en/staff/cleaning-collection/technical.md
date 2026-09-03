# Cleaning & Collection — Technical

## Routes

| Method | URL                               | Controller                | Route name                |
| ------ | --------------------------------- | ------------------------- | ------------------------- |
| POST   | `/staff/tasks/:number/cleaning`   | `staff.Cleaning.update`   | `staff.cleaning.update`   |
| POST   | `/staff/tasks/:number/collection` | `staff.Collection.update` | `staff.collection.update` |
| GET    | `/staff/tasks/:number/tag`        | `staff.Tag.show`          | `staff.tag.show`          |

The ready-for-pickup message has no route: it is sent by the daily
`send:daily-notices` command, not by a staff action.

Source statuses:

```ts
TASK_SOURCE_STATUS[CLEANING] = OrderStatus.IN_CLEANING
TASK_SOURCE_STATUS[COLLECTION] = OrderStatus.CLEANING_DONE
```

Neither is in `CLAIMABLE_TASKS = [PICKUP, DELIVERY, INSPECTION]`, so `claim()`
returns `true` immediately without touching the row.

## Files

| Concern      | Path                                                                                                            |
| ------------ | --------------------------------------------------------------------------------------------------------------- |
| Controllers  | `cleaning_`, `collection_`, `tag_controller.ts` in [app/controllers/staff/](../../../../app/controllers/staff/) |
| Service      | [app/services/task_service.ts](../../../../app/services/task_service.ts)                                        |
| Daily notice | [app/services/notice_service.ts](../../../../app/services/notice_service.ts), `commands/send_daily_notices.ts`  |
| WhatsApp     | [app/notifications/whatsapp_service.ts](../../../../app/notifications/whatsapp_service.ts)                      |

## Cleaning

```ts
async completeCleaning(user, order, photo) {
  const [next] = this.orderService.nextStatuses(order)

  if (!next) {
    throw new vineErrors.E_VALIDATION_ERROR([
      { field: 'form', message: 'Pesanan ini tidak sedang dalam pencucian.' },
    ])
  }

  const photoPath = await this.#storePhoto(photo)

  return db.transaction(async (trx) => {
    await this.orderService.transitionTo(order, next, trx)
    await this.#recordAction(order, user, ActionName.CLEANING_DONE, trx, photoPath)
    return order
  })
}
```

The destination is **not hardcoded** — it comes from `nextStatuses`, which
collapses the two `in_cleaning` options:

```ts
nextStatuses(order) {
  if (order.status !== OrderStatus.IN_CLEANING) return ORDER_TRANSITIONS[order.status]
  return this.isDeliverable(order) ? [IN_DELIVERY] : [CLEANING_DONE]
}

isDeliverable(order) {
  return DELIVERABLE_TYPES.includes(order.type) && order.addressId !== null
}
// DELIVERABLE_TYPES = [ONLINE, WALK_IN_DELIVERY]
```

Note `completeCleaning` does **not** call `#assertHolder` or `#clearClaim` —
cleaning is unclaimed work.

The controller picks its flash message with `awaitsDelivery(updated)`
(`status === IN_DELIVERY`).

## Collection

```ts
async completeCollection(user, order) {
  return db.transaction(async (trx) => {
    await this.orderService.transitionTo(order, OrderStatus.COMPLETED, trx)
    await this.#recordAction(order, user, ActionName.COLLECTED, trx)
    return order
  })
}
```

The lightest completion path: no photo, no validator, no claim check. Safety
comes from `transitionTo`, which rejects anything not in
`ORDER_TRANSITIONS[cleaning_done] = [completed]`.

## Ready notice

Nobody presses a button for this. `node ace send:daily-notices` runs once a day
from the host's scheduler and tells every order that is waiting.

```ts
async sendReadyForCollectionNotices(): Promise<NoticeResult> {
  return this.#deliver({
    action: ActionName.READY_NOTICE_SENT,
    status: OrderStatus.CLEANING_DONE,
    eligible: () => this.#unnotified(OrderStatus.CLEANING_DONE, ActionName.READY_NOTICE_SENT),
    send: (order) =>
      this.whatsappService.sendReadyForCollection(order.customerPhone, order.orderNumber),
  })
}
```

Eligibility is `status = cleaning_done` with no `ready_notice_sent` action —
served by the composite index `['order_id', 'name']` on `order_actions`. The
same run also chases unpaid bills — both live in
[app/services/notice_service.ts](../../../../app/services/notice_service.ts).

**Status is re-read immediately before sending.** The list is queried once at the
start of the run, so an order collected or cancelled in between is skipped
rather than messaged.

**This is not transactional.** The WhatsApp send happens first; if recording the
action then fails, the order stays due and is picked up by tomorrow's run.
Acceptable given the low stakes of a duplicate message.

### Failure handling

A number that cannot be reached is logged and counted, and the run carries on to
the next order. No action is recorded for it, so the next day tries again. The
command exits `1` when anything failed, which is what a scheduler alerts on.

## Tag

`Tag.show` calls `findByNumber` (fully preloaded: address, items→orderItems,
actions→staff) and renders `staff/order/tag`. **No status guard and no claim** —
the tag can be printed at any stage.

## Queues

```ts
getCleaningQueue() // status = in_cleaning,   preload items + actions, oldest first
getCollectionQueue() // status = cleaning_done, preload items + actions, oldest first
```

Neither uses `#claimableQuery`, so every staff member sees the same list. Both
preload `items` and `actions`, and are rendered with the `toDetail` transformer
variant.

## Edge cases

- **`completeCleaning` reads `nextStatuses` before storing the photo**, so a
  wrong-status order fails without an orphaned file — unlike trips and
  inspection.
- **An order with no `next`** (already completed or cancelled) gives a clear
  validation message rather than a crash.
- **`WALK_IN_DELIVERY` counter orders are deliverable**; plain `OFFLINE` ones are
  not, even if an address somehow exists.
- **The ready-notice check is per order, not per recipient** — changing the
  customer's phone does not re-enable it.
- **Collection has no photo evidence.** The `collected` action records who and
  when only.

→ One-minute version: [tldr.md](tldr.md)
→ Plain-language walkthrough: [guide.md](guide.md)
