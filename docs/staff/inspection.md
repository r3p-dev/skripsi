# Staff — Inspection

Where an order stops being a promise and becomes a priced piece of work. This is
the most consequential screen in the staff app: everything the customer is
charged, everything the reports count, and everything the receipt says is decided
here.

**Code:** [`inspection_controller.ts`](../../app/controllers/staff/inspection_controller.ts) ·
[`TaskService.completeInspection` / `createOrderItems` / `replaceOrderItems`](../../app/services/task_service.ts) ·
[`order_controller.ts`](../../app/controllers/staff/order_controller.ts) (the edit half) ·
pages [`staff/inspection/show.tsx`](../../inertia/pages/staff/inspection/show.tsx),
[`staff/order/edit.tsx`](../../inertia/pages/staff/order/edit.tsx)

Prerequisite: [task-board.md](task-board.md).

---

## 1. The job

The shoes are on the bench. The staff member must record, for each physical item:

- **what it is** — brand, model, material, size, condition, optional note
- **what it needs** — one main service, plus any number of additional services

and then photograph the batch. From that, the system derives the price and moves
the order to `awaiting_payment`.

---

## 2. Opening an inspection claims it

```
GET /staff/inspections/:number
  └─ TaskService.claimTask(staff, number, ActionName.INSPECTION)
  └─ blocked = lock.staffId !== staff.id
  └─ services = blocked ? [] : OrderService.getAvailableServices()
  └─ render staff/inspection/show { order, services, blocked }
```

Unlike a pickup, claiming an inspection does **not** change the order status —
there is no customer-facing "being inspected right now" state distinct from
`in_inspection`. The lock is purely internal.

Note the small optimisation: a blocked view is sent an **empty catalogue**. There
is no form to fill, so there is no reason to serialise the price list into the
page.

---

## 3. The form

[`item_fields.tsx`](../../inertia/components/organisms/item_fields.tsx) manages a
dynamic, addable/removable list of item rows. Each row asks for the service
first, then the item's details.

The **item type is never asked for** — it is derived from the chosen service's
category:

```ts
const itemTypeByCategory = {
  shoe_wash:   'shoe',
  shoe_repair: 'shoe',
  bag_wash:    'bag',
  helmet_wash: 'helmet',
}
```

> **Why:** picking "Cuci Helm" and then separately declaring the item is a shoe
> is a contradiction the form should not permit. Deriving it removes a field, a
> decision, and a class of bad data — on a phone, in a workshop, with wet hands.

Additional services (`type = 'additional'`: unyellowing, anti-bau, water
repellent) are checkboxes on the same row, applied to that item.

Payload shape, validated by `item` in [`shared.ts`](../../app/validators/shared.ts):

```ts
{
  brand, model, type, size, material, condition,   // all trimmed strings
  note?,                                            // optional
  service: number,                                  // the main service id
  additionalServices?: number[],                    // extra service ids
}
```

⚠️ `material` is **required** by the validator even though `items.material` is
nullable in the database. And `size` is a string in the validator, then coerced
again with `String(itemData.size)` in the service — belt and braces from an
earlier numeric version of the field.

---

## 4. Submitting

```
PUT /staff/inspections/:number      (multipart: photo + items[])
  └─ inspectionValidator            photo: image(), items: array of item
  └─ TaskService.completeInspection(staff, number, payload)
  └─ redirect → staff.order.edit    ← NOT back to the queue
```

```ts
async completeInspection(staff, orderNumber, data) {
  const order     = await this.getTaskOrderHeldBy(staff, orderNumber, ActionName.INSPECTION)
  const photoPath = await this.storePhoto(ActionName.INSPECTION, data.photo)

  return db.transaction(async (trx) => {
    const totalPrice = await this.createOrderItems(order, data.items, trx)

    await OrderAction.create({ orderId: order.id, staffId: staff.id, name: ActionName.INSPECTION, photoPath, note: null }, { client: trx })

    return order.merge({ totalPrice, status: OrderStatus.AWAITING_PAYMENT }).useTransaction(trx).save()
  })
}
```

Items, the action row, the total, and the status change are **one transaction**.
A half-priced order — items written but no total, or a total with no lines — would
be visible to the customer as a wrong bill.

### The redirect is unusual and intentional

Finishing an inspection sends the staff member to the **item correction form**,
not back to the task board.

> **Why:** this is the one moment they still remember what they typed, with the
> shoes still in front of them. Once the customer pays, the order is unreachable
> for corrections forever (see §6). Landing them on the review screen turns
> "check your work" from a thing people mean to do into the default path.

---

## 5. Pricing — `createOrderItems`

This method is shared by inspection, walk-in intake, and item corrections. It is
the only place order lines are created.

```ts
// 1. every service the payload mentions, main and additional, in ONE query
const requestedServiceIds = new Set(items.flatMap((i) => [i.service, ...(i.additionalServices ?? [])]))
const services   = await Service.query({ client: trx }).whereIn('id', [...requestedServiceIds])
const servicesById = new Map(services.map((s) => [s.id, s]))

let totalPrice = 0

for (const itemData of items) {
  const item = await Item.create({ type, brand, model, material, size: String(size), condition, note }, { client: trx })

  for (const serviceId of [itemData.service, ...(itemData.additionalServices ?? [])]) {
    const service = servicesById.get(serviceId) ?? (await Service.findOrFail(serviceId))
    const price   = Number(service.price)

    await OrderItem.create({
      orderId:  order.id,
      itemId:   item.id,
      serviceId: service.id,
      name:     `${service.name} - ${item.brand} ${item.model}`,
      price,
      subtotal: price,
    }, { client: trx })

    totalPrice += price
  }
}

return totalPrice
```

Four things to understand here.

### 5.1 One `order_items` row per (item × service)

Five pairs of shoes each needing a deep clean plus unyellowing produces **ten**
rows. The receipt is therefore itemised down to each service on each pair, which
is exactly what a customer disputing a bill wants to see.

`price` and `subtotal` are both set to the service price. `subtotal` exists as
the "line total" concept for a future quantity or discount feature; today it
always equals `price`.

### 5.2 The price is copied, not referenced

`price` is a **frozen copy** taken at this moment. Nothing ever re-reads
`services.price` for an existing order.

> **Why this is the most important line in the file:** the catalogue is editable
> by an admin at any time. If order lines read the live price, raising "Deep
> Clean Sepatu" from 35,000 to 40,000 tomorrow would retroactively change what
> last month's customers were charged, break every printed receipt, and silently
> restate every historical revenue report. The copy is the contract between shop
> and customer at the moment it was made.

`name` is copied for the same reason, with the item baked in:
`"Deep Clean Sepatu - Nike Air Force 1"`. Renaming the service later does not
rewrite the receipt.

`service_id` is kept only so reporting can group by service — and its FK is
`RESTRICT`, so a service that has priced an order can never be deleted. See
[admin/catalogue.md](../admin/catalogue.md).

### 5.3 Services are fetched once, up front

The `Set` + `Map` exists because pricing used to run a query per line. An order
of five pairs with one add-on each was ten round trips inside a transaction.
Now it is one.

The `?? (await Service.findOrFail(serviceId))` fallback only fires for a service
id that is not in the database — a hand-crafted payload — and preserves the 404
that `findOrFail` has always produced for that case. One throwaway query on a bad
request only.

### 5.4 Item rows are per-order, not a shared catalogue of things

A new `items` row is created for every inspection. Two visits by the same pair of
shoes produce two `items` rows. The table is a record of *what was handled on this
order*, not an inventory — which is why `replaceOrderItems` can safely delete
them.

---

## 6. The correction window

`GET /staff/orders/:number/items` → `PUT /staff/orders/:number/items`

```ts
// TaskService.getEditableItemsOrder — the whole rule is in the query
Order.query()
  .where('order_number', orderNumber)
  .where('status', OrderStatus.AWAITING_PAYMENT)
  .preload('items', (q) => q.preload('service').preload('item'))
  .preload('actions', (q) => q.preload('staff'))
  .firstOrFail()
```

**Only an order that has been inspected but not yet paid can be corrected.**

> **Why the window closes at payment:** the price the customer agreed to and paid
> is settled. Changing the lines afterwards would either mean charging a
> different amount than was collected, or a receipt that disagrees with the
> payment. And by then the shoes are already being washed — there is nothing left
> to re-inspect.

The form is pre-filled from the existing lines. Note the controller's
`.depth(2)`:

```ts
items: OrderItemTransformer.transform(order.items).depth(2)
```

The form needs each line's **item** (to fill brand/model/size) and its
**service** (to pre-select the dropdown), and nested transformers stop at one
level by default.

### Replace, don't diff

```ts
async replaceOrderItems(staff, orderNumber, data) {
  const order = await this.getEditableItemsOrder(orderNumber)

  return db.transaction(async (trx) => {
    const replacedItemIds = order.items.map((oi) => oi.itemId)

    await OrderItem.query({ client: trx }).where('order_id', order.id).delete()
    if (replacedItemIds.length > 0) await Item.query({ client: trx }).whereIn('id', replacedItemIds).delete()

    const totalPrice = await this.createOrderItems(order, data.items, trx)

    await OrderAction.create({ ..., name: ActionName.ITEMS_EDITED }, { client: trx })

    return order.merge({ totalPrice }).useTransaction(trx).save()
  })
}
```

The whole list is rewritten. The form always submits every row it is showing, and
an order at this stage has a handful of lines — diffing would be more code for no
benefit, and it would have to handle "this line's service changed" anyway, which
is a delete plus an insert.

Deleting the `items` rows is safe precisely because of §5.4: an item belongs to
exactly one order's lines.

An `items_edited` action is logged. It carries no photo and no note, but it
names the staff member and the moment — so the admin audit trail shows that the
order was repriced after inspection, and by whom.

⚠️ **Unlike every other task operation, this one is not ownership-checked.** Any
staff member can correct any order that is awaiting payment. That is deliberate —
the person who inspected may have gone home, and a wrong bill needs fixing — but
it means `replaceOrderItems` takes `staff` only to attribute the action, not to
authorise it.

⚠️ Prices are **re-read from the live catalogue** during a correction. If an
admin changed a price between the inspection and the correction, the corrected
order picks up the new price. Correct behaviour (the correction is a fresh
quote), but worth knowing when a total changes by more than the edit explains.

Saving redirects to the task board with
*"Barang pesanan ORD… diperbarui."*

---

## 7. What the customer sees

The moment inspection completes:

- status becomes *"Menunggu Pelunasan"*
- the order page grows a payment card with **Bayar Sekarang**
- the itemised lines and total appear
- the inspection photo joins the progress photos, and later pairs with the
  cleaning photo in the before/after slider

Nothing is sent to the customer — no WhatsApp, no push. They find out by opening
the app. (Fonnte is used only for password reset and phone verification.)

---

## 8. Where to change things

| To change…                             | Edit                                                                  |
| -------------------------------------- | --------------------------------------------------------------------- |
| Fields recorded per item               | `item` in [`shared.ts`](../../app/validators/shared.ts) + the `items` migration + `item_fields.tsx` |
| Service category → item type mapping   | `itemTypeByCategory` in [`item_fields.tsx`](../../inertia/components/organisms/item_fields.tsx) |
| Line naming (`"Service - Brand Model"`)| `createOrderItems`                                                    |
| When corrections close                 | the status filter in `getEditableItemsOrder`                          |
| Quantities or discounts                | `subtotal` is the field that already exists for it                    |
