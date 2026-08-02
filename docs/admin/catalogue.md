# Admin — Service Catalogue

The price list the whole business quotes from: the public landing page, the
customer booking screen, the inspection form, and the walk-in counter all read
this one table.

**Code:** [`catalogue_service.ts`](../../app/services/catalogue_service.ts) ·
[`admin/service_controller.ts`](../../app/controllers/admin/service_controller.ts) ·
[`service_validator.ts`](../../app/validators/service_validator.ts) ·
pages under [`inertia/pages/admin/service/`](../../inertia/pages/admin/service/)

---

## 1. What a service is

| Column        | Meaning                                                        |
| ------------- | -------------------------------------------------------------- |
| `name`        | "Deep Clean Sepatu", "Lem Sol Sepatu"                          |
| `description` | One line, shown on the landing page and the price accordion     |
| `price`       | `decimal(8,2)`, whole Rupiah in practice                        |
| `category`    | `shoe_wash` \| `bag_wash` \| `helmet_wash` \| `shoe_repair` \| `additional` |
| `type`        | `regular` \| `start_from` \| `additional`                       |

**Category** drives two things: how the price list is grouped on customer-facing
screens, and — importantly — what physical item type the inspection form derives:

```ts
// inertia/components/organisms/item_fields.tsx
const itemTypeByCategory = { shoe_wash: 'shoe', shoe_repair: 'shoe', bag_wash: 'bag', helmet_wash: 'helmet' }
```

Picking "Cuci Helm" makes the item a helmet. Staff never choose the item type
separately, so **a new category must be added to that map** or items priced with
it get no type.

**Type** controls presentation and role:

| Type          | Label      | Effect                                                            |
| ------------- | ---------- | ----------------------------------------------------------------- |
| `regular`     | Harga      | A firm price                                                      |
| `start_from`  | Mulai dari | The page prints "mulai" before the figure — damage-dependent work  |
| `additional`  | Tambahan   | An add-on, offered as a checkbox alongside a main service          |

The seeded catalogue is in
[`service_seeder.ts`](../../database/seeders/service_seeder.ts) — ten entries
covering shoe, bag and helmet washing, repairs, and add-ons.

---

## 2. Prices are current asking prices, never historical ones

This is the concept the whole feature turns on, and it is stated at the top of
the service:

```ts
/**
 * Prices here are the *current* asking price. They are copied onto an order
 * line at inspection time, so editing an entry never reprices an order that
 * has already been quoted — see `TaskService.createOrderItems`.
 */
```

`order_items` stores a **frozen copy** of the name and price at the moment the
order was priced:

```ts
name:     `${service.name} - ${item.brand} ${item.model}`,
price:    Number(service.price),
subtotal: price,
```

> **Why:** raising "Deep Clean Sepatu" from 35,000 to 40,000 must change what
> *future* work costs and nothing else. If order lines referenced the live price,
> the change would retroactively alter what last month's customers were charged,
> break every printed receipt, and silently restate every historical revenue
> figure. Reports sum `order_items.subtotal` for exactly the same reason — see
> [reports.md](reports.md).

So editing a price is safe. **Deleting an entry is not**, which is why deletion is
guarded.

---

## 3. CRUD

| Route                              | Method                          |
| ---------------------------------- | ------------------------------- |
| `GET /admin/services`              | `getAllServices` + `getInUseServiceIds` |
| `GET /admin/services/create`       | form                             |
| `POST /admin/services`             | `createService`                  |
| `GET /admin/services/:id/edit`     | form + `isInUse`                 |
| `PUT /admin/services/:id`          | `updateService`                  |
| `DELETE /admin/services/:id`       | `deleteService`                  |
| `GET /admin/services/export`       | `getAllServicesForExport`        |

### Listing

```ts
Service.query()
  .if(filters.search, (q) => q.whereILike('name', `%${s}%`).orWhereILike('description', `%${s}%`))
  .orderBy('created_at', 'asc')       // ← oldest first
```

> **Why ascending:** it matches the order the booking form and the inspection
> form render the catalogue in. An admin reordering the list in their head
> against what staff see would be pointless friction.

### Validation

```ts
const serviceName  = () => vine.string().trim().minLength(3).maxLength(100)
const servicePrice = () => vine.number().positive().max(100_000_000)
```

The shared `name()` rule is **not** used here:

> **Why:** the shared rule is alpha-only (it is for people's names). A catalogue
> entry carries digits and punctuation — "Cuci Sepatu 2x", "Reparasi Sol - Lem" —
> and would be rejected outright.

The validator also swaps one label:

```ts
serviceValidator.messagesProvider = new SimpleMessagesProvider(validationMessages, {
  ...validationFields,
  name: 'Nama layanan',      // the app-wide label is "Nama lengkap"
})
```

Prices are whole Rupiah. The column is a decimal, but nothing in this business is
priced in cents and a fractional price would print oddly on a receipt.

Covered by [`tests/unit/service_validator.spec.ts`](../../tests/unit/service_validator.spec.ts).

---

## 4. Deletion is refused once a service has priced an order

```ts
async deleteService(id: number): Promise<Service> {
  const service = await this.getService(id)

  if (await this.isInUse(service)) {
    throw E_VALIDATION_ERROR('id', 'Layanan ini sudah dipakai pada pesanan dan tidak dapat dihapus.')
  }

  await service.delete()
  return service
}
```

```ts
async isInUse(service: Service): Promise<boolean> {
  const result = await OrderItem.query().where('service_id', service.id).count('* as total')
  return Number(result[0].$extras.total) > 0
}
```

The database would refuse anyway — `order_items.service_id` is a `RESTRICT`
foreign key — so this check exists to turn a Postgres error into an explanation.

> **Why keep the reference at all, if the price is already copied?** Because
> reports group revenue by service (`Layanan Terlaris`). The copy makes the
> *money* correct; the FK makes the *grouping* possible. Deleting the service
> would orphan every historical line's identity, and the receipt for that order
> still names it.

### Pre-computed, so the button is disabled rather than failing

```ts
// list page
inUseIds: await this.catalogueService.getInUseServiceIds(services.all())

// edit page
isInUse: await this.catalogueService.isInUse(service)
```

`getInUseServiceIds` does it for the whole page in one query:

```ts
OrderItem.query().whereIn('service_id', ids).distinct('service_id').select('service_id')
```

> **Why bother:** an admin should learn a rule from a disabled button with a
> tooltip, not by clicking and being refused. The service still enforces it — the
> pre-computation is UX, not security. This pattern repeats in
> [users.md](users.md) with `undeletableIds`.

**A service in use can still be edited.** Name, description, price, category and
type are all changeable — existing orders keep their copies.

---

## 5. Who else reads this table

| Reader                                                    | Via                                        | Notes                                              |
| --------------------------------------------------------- | ------------------------------------------ | -------------------------------------------------- |
| Public landing page                                       | `HomeController` → `getAvailableServices()` | The carousel reads the same catalogue the shop charges from, so marketing prices cannot drift |
| Customer booking screen                                   | `getAvailableServices()`                    | Read-only price accordion grouped by category      |
| Staff inspection form                                     | `getAvailableServices()`                    | The pickers; prices are copied on submit            |
| Staff walk-in form                                        | `getAvailableServices()`                    | Same                                                |
| Reports "Layanan Terlaris"                                | join through `order_items`                  | Summed from `subtotal`, not from `services.price`   |

`OrderService.getAvailableServices()` is just
`Service.query().orderBy('created_at', 'asc')` — there is no "active"/"archived"
flag. **Every service in the table is offered everywhere.** To retire one without
deleting it you would need to add such a flag; today the only options are edit or
delete.

---

## 6. Export

`GET /admin/services/export` → one sheet, following the search box:

`Nama · Deskripsi · Kategori · Tipe · Harga · Dibuat`

> **Why this export matters more than the others:** it is the shop's price list.
> It is the version of this screen anyone outside the app actually asks for —
> to print, to send to a partner, to check against a banner.

`Harga` is written via `excelNumber()` as a real number with a Rupiah format, so
the column sorts and sums. See [exports.md](exports.md).

---

## 7. Where to change things

| To change…                            | Edit                                                                          |
| ------------------------------------- | ----------------------------------------------------------------------------- |
| Add a category or service type        | [`service_enum.ts`](../../app/enums/service_enum.ts) — **and** `itemTypeByCategory` in [`item_fields.tsx`](../../inertia/components/organisms/item_fields.tsx) |
| Name/price constraints                | [`service_validator.ts`](../../app/validators/service_validator.ts)           |
| Allow retiring a service              | Add an `is_active` column and filter `getAvailableServices()`                  |
| Seeded starting catalogue             | [`service_seeder.ts`](../../database/seeders/service_seeder.ts)                |
| Support per-item quantity or discount | `order_items.subtotal` is the field that already exists for it                 |
