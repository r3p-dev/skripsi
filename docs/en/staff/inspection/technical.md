# Inspection — Technical

## Routes

| Method | URL                               | Controller                 | Route name                 |
| ------ | --------------------------------- | -------------------------- | -------------------------- |
| GET    | `/staff/tasks/:number/inspection` | `staff.Inspection.show`    | `staff.inspection.show`    |
| POST   | `/staff/tasks/:number/inspection` | `staff.Inspection.update`  | `staff.inspection.update`  |
| DELETE | `/staff/tasks/:number/inspection` | `staff.Inspection.destroy` | `staff.inspection.destroy` |

Source status: `TASK_SOURCE_STATUS[INSPECTION] = OrderStatus.IN_PICKUP`.

## Files

| Concern           | Path                                                                                                         |
| ----------------- | ------------------------------------------------------------------------------------------------------------ |
| Controller        | [app/controllers/staff/inspection_controller.ts](../../../../app/controllers/staff/inspection_controller.ts) |
| Task service      | [app/services/task_service.ts](../../../../app/services/task_service.ts)                                     |
| Catalogue service | [app/services/catalogue_service.ts](../../../../app/services/catalogue_service.ts)                           |
| Validator         | `inspectionValidator` in [task_validator.ts](../../../../app/validators/task_validator.ts)                   |

## Validator

```ts
export const inspectedItem = vine.object({
  type: vine.enum(ItemType),
  brand: string.trim().maxLength(50),
  model: string.trim().maxLength(50),
  size: string.trim().maxLength(20),
  material: string.trim().maxLength(50),
  condition: string.trim().maxLength(255),
  note: note(),
  catalogue: vine.number().positive(),
  additionalCatalogues: vine.array(vine.number().positive()).optional(),
})

export const inspectionValidator = vine.create({
  photo: image(),
  items: vine.array(inspectedItem).minLength(1).maxLength(MAX_ITEMS_PER_ORDER), // 10
})
```

`inspectedItem` is shared with `offlineOrderValidator` and `orderItemsValidator`
— the same shape drives inspection, counter orders, and item corrections.

## Catalogue eligibility

```ts
ItemTypeCategories: Record<ItemType, CatalogueCategory[]> = {
  shoe:   [SHOE_WASH, SHOE_REPAIR],
  bag:    [BAG_WASH],
  helmet: [HELMET_WASH],
}

#isCatalogueFor(catalogue, type) {
  return catalogue.type !== CatalogueType.ADDITIONAL
      && ItemTypeCategories[type].includes(catalogue.category)
}
```

Add-ons use `#isAdditionalCatalogueFor`, which accepts anything of
`CatalogueType.ADDITIONAL` regardless of item type — the enum comments this
explicitly: a coating or rush fee applies to a shoe as well as a bag.

### `resolveForSelections`

One query for all referenced catalogue ids, then per-selection validation:

```ts
const ids = [...new Set(selections.flatMap((s) => [s.catalogue, ...(s.additionalCatalogues ?? [])]))]
const catalogues = await Catalogue.query(...).whereIn('id', ids)
const byId = new Map(catalogues.map((c) => [c.id, c]))
```

Errors are raised on precise paths so the UI can highlight the offending row:

- `items.{index}.catalogue`
- `items.{index}.additionalCatalogues.{additionalIndex}`

Returns `Map<id, Catalogue>` for the caller to price from — resolution happens
once, before the transaction.

## Completing an inspection

```ts
async completeInspection(user, order, data) {
  this.#assertHolder(user, order)
  const catalogues = await this.catalogueService.resolveForSelections(data.items)
  const photoPath = await this.#storePhoto(data.photo)

  return db.transaction(async (trx) => {
    await Item.query({ client: trx }).where('order_id', order.id).delete()

    let total = 0
    for (const entry of data.items) {
      total += await this.#recordInspectedItem(order, entry, catalogues, trx)
    }

    order.merge({ totalPrice: total.toString() })
    order.useTransaction(trx)
    await order.save()

    await this.orderService.transitionTo(order, OrderStatus.AWAITING_PAYMENT, trx)
    await this.#recordAction(order, user, ActionName.INSPECTION, trx, photoPath)
    await this.#clearClaim(order, trx)
    return order
  })
}
```

Note the **delete-then-recreate**: `Item.query().where('order_id').delete()`
removes the customer's declared items. `order_items` cascade off `items`
(`ON DELETE CASCADE`), so the service lines go with them.

Catalogue resolution and photo storage happen **before** the transaction opens —
so a validation failure costs no database work, but a rollback leaves an
orphaned photo.

## Recording one item

```ts
async #recordInspectedItem(order, entry, catalogues, trx) {
  const item = await Item.create({ orderId: order.id, ...entry }, { client: trx })

  const chosen = [entry.catalogue, ...(entry.additionalCatalogues ?? [])]
  const lines = chosen.map((catalogueId) => {
    const catalogue = catalogues.get(catalogueId)!
    return {
      orderId: order.id, itemId: item.id, catalogueId: catalogue.id,
      name: catalogue.name, condition: entry.condition,
      price: catalogue.price, subtotal: Number(catalogue.price).toString(),
    }
  })

  await OrderItem.createMany(lines, { client: trx })
  return lines.reduce((total, line) => total + Number(line.subtotal), 0)
}
```

`OrderItem.createMany` batches the service lines into one insert. The item
itself still needs its own insert first, because the lines need `item.id`.

**`name` and `price` are copied onto the line**, not joined. A later catalogue
price change does not rewrite historical orders.

## Data model

`order_items`
([migration](../../../../database/migrations/1781150474789_create_order_items_table.ts)):

| Column                      | Notes                         |
| --------------------------- | ----------------------------- |
| `order_id`                  | FK → orders, CASCADE          |
| `catalogue_id`              | FK → catalogues, **RESTRICT** |
| `item_id`                   | FK → items, CASCADE           |
| `name`, `price`, `subtotal` | denormalised snapshot         |
| `condition`                 | copied from the item          |

`RESTRICT` on `catalogue_id` is why a catalogue in use cannot be deleted — see
[admin/catalogue](../../admin/catalogue/).

## Blocked rendering

`Inspection.show` claims first, and on failure renders with `blocked: true` and
an empty catalogue array — the expensive `getPublicCatalogues()` is skipped for
a staff member who cannot act.

## Edge cases

- **The customer's items are destroyed**, along with any prior inspection.
- **Re-pricing is always total**, never incremental.
- **`condition` is stored on every `order_item` line** for the item, duplicating
  it per service.
- **The photo-before-transaction window** can orphan a file.
- `#recordInspectedItem` uses a non-null assertion on `catalogues.get(...)`,
  which is safe only because `resolveForSelections` already validated every id.

→ One-minute version: [tldr.md](tldr.md)
→ Plain-language walkthrough: [guide.md](guide.md)
