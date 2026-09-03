# Catalogue — Technical

## Routes

| Method | URL                          | Controller                | Route name                |
| ------ | ---------------------------- | ------------------------- | ------------------------- |
| GET    | `/admin/catalogues`          | `admin.Catalogue.index`   | `admin.catalogue.index`   |
| GET    | `/admin/catalogues/create`   | `admin.Catalogue.create`  | `admin.catalogue.create`  |
| POST   | `/admin/catalogues`          | `admin.Catalogue.store`   | `admin.catalogue.store`   |
| GET    | `/admin/catalogues/:id/edit` | `admin.Catalogue.edit`    | `admin.catalogue.edit`    |
| PUT    | `/admin/catalogues/:id`      | `admin.Catalogue.update`  | `admin.catalogue.update`  |
| DELETE | `/admin/catalogues/:id`      | `admin.Catalogue.destroy` | `admin.catalogue.destroy` |

Addressed by **id**, unlike orders which use `order_number`.

## Files

| Concern    | Path                                                                                                       |
| ---------- | ---------------------------------------------------------------------------------------------------------- |
| Controller | [app/controllers/admin/catalogue_controller.ts](../../../../app/controllers/admin/catalogue_controller.ts) |
| Service    | [app/services/catalogue_service.ts](../../../../app/services/catalogue_service.ts)                         |
| Validator  | [app/validators/catalogue_validator.ts](../../../../app/validators/catalogue_validator.ts)                 |
| Enums      | [app/enums/catalogue_enum.ts](../../../../app/enums/catalogue_enum.ts)                                     |

## Validator and the name mapping

```ts
export const catalogueValidator = vine.create({
  catalogueName: vine.string().trim().minLength(3).maxLength(100),
  description: vine.string().trim().minLength(3).maxLength(255),
  price: price(), // number.positive().max(100_000_000)
  category: vine.enum(Object.values(CatalogueCategory)),
  type: vine.enum(Object.values(CatalogueType)),
})
```

The form field is `catalogueName` but the column is `name`:

```ts
#toAttributes({ catalogueName, price, ...rest }: CatalogueData) {
  return { ...rest, name: catalogueName, price: price.toString() }
}
```

`price` also converts number → string for the `decimal(8,2)` column.

## Enums

```ts
CatalogueType = { REGULAR, START_FROM, ADDITIONAL }
CatalogueCategory = { SHOE_WASH, BAG_WASH, HELMET_WASH, SHOE_REPAIR, ADDITIONAL }
```

Note `ADDITIONAL` exists in **both** — `type` marks a row as an add-on, while
`category` groups it. Eligibility keys off `type`:

```ts
#isCatalogueFor(catalogue, itemType) {
  return catalogue.type !== CatalogueType.ADDITIONAL
      && ItemTypeCategories[itemType].includes(catalogue.category)
}
```

`ItemTypeCategories` lives in [item_enum.ts](../../../../app/enums/item_enum.ts).

## Listing

```ts
async list(filters: { search: string; page: number }) {
  const query = Catalogue.query().orderBy('created_at', 'desc')

  if (filters.search) {
    query.where((builder) => {
      builder
        .whereILike('name', `%${filters.search}%`)
        .orWhereILike('description', `%${filters.search}%`)
    })
  }

  return query.paginate(filters.page, 10)
}
```

Unlike `orders` and `users`, **`catalogues` has no trigram index** — its
`ILIKE '%term%'` search does a sequential scan. Acceptable because the table is
small and admin-managed.

## In-use detection

```ts
async inUseIds(catalogues: Catalogue[]): Promise<number[]> {
  const ids = catalogues.map((c) => c.id)
  if (ids.length === 0) return []

  const rows = await db.from('order_items').whereIn('catalogue_id', ids).distinct('catalogue_id')
  return rows.map((row) => Number(row.catalogue_id))
}
```

One batched query for the whole page — no N+1. `index` passes `inUseIds`, and
`edit` passes `isInUse` for a single row.

## Deletion guard

```ts
async deleteCatalogue(id: number): Promise<void> {
  const catalogue = await Catalogue.findOrFail(id)
  const booked = await db.from('order_items')
    .where('catalogue_id', catalogue.id).count('* as total').first()

  if (Number(booked?.total ?? 0) > 0) {
    throw new errors.E_VALIDATION_ERROR([
      { field: 'form', message: 'Layanan ini sudah pernah dipesan dan tidak dapat dihapus.' },
    ])
  }

  await catalogue.delete()
}
```

Two layers: the service check gives a readable message, and
`order_items.catalogue_id` is `ON DELETE RESTRICT`, so even bypassing the service
fails at the database.

**Editing is not blocked** — only deletion. `isInUse` on the edit screen is
advisory.

## Price snapshotting

At inspection, `#recordInspectedItem` copies `catalogue.name` and
`catalogue.price` onto each `order_item` row. Historical orders are therefore
immune to catalogue edits, which is what makes free price editing safe.

## Data model

`catalogues`
([migration](../../../../database/migrations/1781150469524_create_catalogues_table.ts)):

| Column        | Notes        |
| ------------- | ------------ |
| `name`        | string       |
| `price`       | decimal(8,2) |
| `description` | text         |
| `category`    | indexed      |
| `type`        | indexed      |

`price` is `decimal(8,2)` — max 999,999.99 — while the validator allows up to
100,000,000. **A price above the column's range will fail at the database, not
in validation.**

## Other consumers

- `getPublicCatalogues()` — inspection and counter-order screens
- `getCatalogueOptions()` — grouped by item type with `catalogues` and
  `additionalCatalogues` per type
- `resolveForSelections()` — validates chosen ids, see
  [staff/inspection](../../staff/inspection/technical.md)

## Edge cases

- **`catalogueName` vs `name`** trips people reading the validator against the
  schema.
- **Validator max (100M) exceeds the column range (999,999.99).**
- **No archive flag** — retired-but-used services stay listed forever.
- **No trigram index** on this table's search columns.
- **`ADDITIONAL` appears in both enums** with different meanings.

→ One-minute version: [tldr.md](tldr.md)
→ Plain-language walkthrough: [guide.md](guide.md)
