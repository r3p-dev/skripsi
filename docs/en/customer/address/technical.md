# Address — Technical

## Routes

| Method | URL                | Controller                | Route name                 | Limiter          |
| ------ | ------------------ | ------------------------- | -------------------------- | ---------------- |
| GET    | `/address`         | `customer.Address.show`   | `customer.address.show`    | —                |
| GET    | `/address/create`  | `customer.Address.create` | `customer.address.create`  | —                |
| POST   | `/address`         | `customer.Address.store`  | `customer.address.store`   | —                |
| GET    | `/address/geocode` | `customer.Geocode.show`   | `customer.address.geocode` | `geocodeLimiter` |
| GET    | `/address/nearby`  | `customer.Geocode.nearby` | `customer.address.nearby`  | `geocodeLimiter` |

`geocodeLimiter`: 30 requests / 1 minute, block 1 minute, keyed on user id
(falling back to IP).

## Files

| Concern         | Path                                                                                                                   |
| --------------- | ---------------------------------------------------------------------------------------------------------------------- |
| Controllers     | `address_controller.ts`, `geocode_controller.ts` in [app/controllers/customer/](../../../../app/controllers/customer/) |
| Address service | [app/services/address_service.ts](../../../../app/services/address_service.ts)                                         |
| Geocoding       | [app/services/geocoding_service.ts](../../../../app/services/geocoding_service.ts)                                     |
| Nearby places   | [app/services/nearby_service.ts](../../../../app/services/nearby_service.ts)                                           |
| Validator       | [app/validators/address_validator.ts](../../../../app/validators/address_validator.ts)                                 |
| Model           | [app/models/address.ts](../../../../app/models/address.ts)                                                             |

## Validator

```ts
addressValidator = {
  name, // 1–50, alpha + spaces + dashes
  phone, // ID phone rule
  street: string.trim().maxLength(255),
  latitude: number.min(-90).max(90),
  longitude: number.min(-180).max(180),
  note: string.trim().optional(),
}
```

Coordinate bounds here are only sanity limits. The real constraint is the
PostGIS check inside the service.

## Data model

`addresses` ([migration](../../../../database/migrations/1781150468467_create_addresses_table.ts)):

| Column                   | Type          | Notes                                     |
| ------------------------ | ------------- | ----------------------------------------- |
| `user_id`                | integer       | indexed, FK → users, `ON DELETE RESTRICT` |
| `latitude` / `longitude` | decimal(10,7) |                                           |
| `is_active`              | boolean       | default `true`                            |

```sql
CREATE UNIQUE INDEX one_active_address_per_user
  ON addresses (user_id) WHERE is_active = true
```

That partial index is the real guarantee of "one active address" — the service
logic and the schema agree.

`operational_areas` holds the service polygons as a genuine PostGIS column:

```sql
geometry geometry(Polygon, 4326) NOT NULL
CONSTRAINT operational_areas_geometry_valid CHECK (ST_IsValid(geometry))
CREATE INDEX operational_areas_geometry_index ON operational_areas USING GIST (geometry)
```

## Service-area checks

Single point, used on save:

```ts
async #isWithinOperationalArea(longitude, latitude) {
  const area = await OperationalArea.query()
    .where('is_active', true)
    .whereRaw('ST_Covers(geometry, ST_SetSRID(ST_MakePoint(?, ?), 4326))', [longitude, latitude])
    .select('id').first()
  return area !== null
}
```

Batch, used to filter geocoder results — **one round trip for the whole set**:

```sql
SELECT candidate.idx
  FROM (VALUES (?::int, ?::float8, ?::float8), ...) AS candidate (idx, longitude, latitude)
 WHERE EXISTS (
   SELECT 1 FROM operational_areas
    WHERE is_active = true
      AND ST_Covers(geometry, ST_SetSRID(ST_MakePoint(candidate.longitude, candidate.latitude), 4326))
 )
```

`filterWithinOperationalArea` previously issued one query per candidate; the
VALUES-list form lets PostGIS answer for all of them against the GIST index at
once. This sits on a search-as-you-type path, so the difference is per-keystroke.

## Replacing an address

`replaceActiveAddress(user, data)`:

1. `#isWithinOperationalArea` — throws `E_VALIDATION_ERROR` on field **`radius`**
   if outside.
2. Inside a transaction:
   - `#removeCurrentAddress(user, trx)`
   - `Address.create({ ...data, userId, isActive: true })`

`#removeCurrentAddress` decides delete vs deactivate:

```ts
if (await this.#isReferencedByOrder(currentAddress, trx)) {
  await currentAddress.merge({ isActive: false }).useTransaction(trx).save()
  return
}
await currentAddress.useTransaction(trx).delete()
```

The FK is `ON DELETE RESTRICT`, so deleting a referenced address would fail at
the database anyway — the check turns that into a graceful deactivation.

## Housekeeping

```ts
async deleteOrphanedAddresses(): Promise<number> {
  const deleted = await Address.query()
    .where('is_active', false)
    .whereDoesntHave('orders', (query) => query)
    .delete()
  return Number(deleted[0] ?? 0)
}
```

A single set-based delete. It is not wired to a route or schedule — call it from
a command or task runner if you want periodic cleanup.

## Geocoding endpoints

`Geocode.show`:

1. `getOperationalAreaBounds()` — `ST_Extent` over active areas, used to bias
   the search.
2. `geocodingService.search(query, bounds)` → Nominatim.
3. `filterWithinOperationalArea(candidates)`.
4. Returns `{ results, reason }` where `reason` is `null`, `'not_found'`,
   `'outside_area'`, or `'unavailable'`.

Any thrown error becomes `503` with `reason: 'unavailable'`, so an upstream
outage degrades rather than erroring the page.

`Geocode.nearby` uses Overpass through `NearbyService` — results sorted by
distance and capped at 12, with an in-process cache of 200 entries.

## Edge cases

- **The `radius` field name is a misnomer.** The check is polygon containment;
  no radius exists. Front-end error display keys on this field.
- **Bounds can be `null`** when no active operational area exists — search then
  runs unbiased and every candidate is filtered out, giving `outside_area`.
- **`getOperationalAreaCentroid()`** (`ST_Centroid(ST_Collect(geometry))`) is the
  depot fallback for route planning, and also returns `null` with no areas.
- **`ON DELETE RESTRICT` on `user_id`** means a customer with an address cannot
  be hard-deleted without dealing with the address first.

→ One-minute version: [tldr.md](tldr.md)
→ Plain-language walkthrough: [guide.md](guide.md)
